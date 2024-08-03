import { S3Client, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, PutBucketWebsiteCommand, PutPublicAccessBlockCommand } from "@aws-sdk/client-s3";
import { CloudFrontClient, GetDistributionCommand, CreateDistributionCommand, UpdateDistributionCommand } from "@aws-sdk/client-cloudfront";
import { fromSSO } from "@aws-sdk/credential-provider-sso";
import { BaseClass } from "./utils/baseClass.js";

export class AwsDeployer extends BaseClass {
  constructor() {
    super();
    const credentials = fromSSO({ profile: 'bypablo' });
    this.s3Client = new S3Client({ 
      region: this.appConfig.vars.AWS_REGION,
      credentials: credentials
    });
    this.cloudFrontClient = new CloudFrontClient({ 
      region: this.appConfig.vars.AWS_REGION,
      credentials: credentials
    });
    this.bucketName = this.appConfig.vars.S3_BUCKET_NAME;
    this.bucketPath = this.appConfig.vars.S3_BUCKET_PATH.replace(/^\/+|\/+$/g, '');
  }

  async execute() {
    try {
      await this.verifyBucketAndPath();
      const bucketExists = await this.verifyBucketExists();
      if (bucketExists) {
        await this.updateBucketPolicy();
        await this.configureBucketWebsite();
      } else {
        console.error('Cannot update policy or configure website for non-existent bucket');
        throw new Error('Bucket does not exist');
      }
      const distributionId = await this.verifyOrCreateCloudFrontDistribution();

      return {
        isValid: true,
        message: 'AWS deployment setup completed successfully.',
        distributionId
      };
    } catch (error) {
      console.error('Error during AWS deployment setup:', error);
      return {
        isValid: false,
        errors: [
          'Error during AWS deployment setup',
          error.message || '',
          error.stack || '',
        ]
      };
    }
  }

  async verifyBucketExists() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(`Bucket ${this.bucketName} exists.`);
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`Bucket ${this.bucketName} does not exist.`);
        return false;
      }
      console.error('Error verifying bucket existence:', error);
      throw error;
    }
  }

  async verifyBucketAndPath() {
    try {
      await this.s3Client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      console.log(`Bucket ${this.bucketName} exists.`);
    } catch (error) {
      if (error.name === 'NotFound') {
        console.log(`Bucket ${this.bucketName} does not exist. Creating...`);
        await this.s3Client.send(new CreateBucketCommand({ Bucket: this.bucketName }));
        console.log(`Bucket ${this.bucketName} created successfully.`);

        // Desactivar el bloqueo de acceso público
        await this.s3Client.send(new PutPublicAccessBlockCommand({
          Bucket: this.bucketName,
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: false,
            IgnorePublicAcls: false,
            BlockPublicPolicy: false,
            RestrictPublicBuckets: false
          }
        }));
        console.log(`Public access block settings updated for bucket ${this.bucketName}`);
      } else {
        throw error;
      }
    }
  }

  async updateBucketPolicy() {
    console.log(`Attempting to update bucket policy for ${this.bucketName}`);
    const policy = {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'PublicReadGetObject',
        Effect: 'Allow',
        Principal: '*',
        Action: 's3:GetObject',
        Resource: `arn:aws:s3:::${this.bucketName}/*`
      }]
    };
  
    try {
      console.log('Sending PutBucketPolicyCommand...');
      await this.s3Client.send(new PutBucketPolicyCommand({
        Bucket: this.bucketName,
        Policy: JSON.stringify(policy)
      }));
      console.log('Bucket policy updated successfully.');
    } catch (error) {
      console.error('Error in updateBucketPolicy:', error);
      if (error.name === 'AccessDenied') {
        console.error('Access denied when updating bucket policy. Please check your IAM permissions.');
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error('AccessDenied: Insufficient permissions to update bucket policy');
      } else {
        throw error;
      }
    }
  }

  async configureBucketWebsite() {
    const params = {
      Bucket: this.bucketName,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: 'index.html'
        },
        IndexDocument: {
          Suffix: 'index.html'
        },
        RoutingRules: [
          {
            Condition: {
              HttpErrorCodeReturnedEquals: '404'
            },
            Redirect: {
              ReplaceKeyWith: 'index.html'
            }
          }
        ]
      }
    };
  
    await this.s3Client.send(new PutBucketWebsiteCommand(params));
    console.log('Bucket website configuration updated successfully.');
  }

  async verifyOrCreateCloudFrontDistribution() {
    console.log('Verifying CloudFront distribution...', this.appConfig.vars);
    const distributionId = this.appConfig.vars.DISTRIBUTION_ID;
  
    if (distributionId) {
      try {
        const { Distribution } = await this.cloudFrontClient.send(new GetDistributionCommand({ Id: distributionId }));
        console.log(`CloudFront distribution ${distributionId} exists.`);
        const needsUpdate = this.checkIfDistributionNeedsUpdate(Distribution);
        if (needsUpdate) {
          await this.updateCloudFrontDistribution(distributionId);
        } else {
          console.log('CloudFront distribution is up to date. No changes needed.');
        }
        return distributionId;
      } catch (error) {
        if (error.name === 'NoSuchDistribution') {
          console.log(`Distribution ${distributionId} not found. Creating a new one...`);
          return await this.createCloudFrontDistribution();
        } else {
          throw error;
        }
      }
    } else {
      console.log('No DISTRIBUTION_ID provided. Creating a new CloudFront distribution...');
      return await this.createCloudFrontDistribution();
    }
  }

  checkIfDistributionNeedsUpdate(distribution) {
    const currentOrigin = distribution.DistributionConfig.Origins.Items[0];
    const desiredDomainName = `${this.bucketName}.s3-website-${this.appConfig.vars.AWS_REGION}.amazonaws.com`;
    
    return (
      currentOrigin.DomainName !== desiredDomainName ||
      currentOrigin.OriginPath !== '' ||
      distribution.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy !== 'redirect-to-https' ||
      distribution.DistributionConfig.DefaultCacheBehavior.ForwardedValues.QueryString !== false ||
      distribution.DistributionConfig.DefaultCacheBehavior.DefaultTTL !== 0 ||
      distribution.DistributionConfig.DefaultCacheBehavior.MaxTTL !== 0 ||
      !distribution.DistributionConfig.CustomErrorResponses ||
      distribution.DistributionConfig.CustomErrorResponses.Quantity !== 1 ||
      distribution.DistributionConfig.DefaultRootObject !== 'index.html'
    );
  }

  async createCloudFrontDistribution() {
    const params = {
      DistributionConfig: {
        CallerReference: Date.now().toString(),
        DefaultCacheBehavior: {
          TargetOriginId: this.bucketName,
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: {
            Quantity: 3,
            Items: ["HEAD", "GET", "OPTIONS"]
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: 'none' }
          },
          MinTTL: 0,
          DefaultTTL: 300,
          MaxTTL: 1200,
          SmoothStreaming: false,
          Compress: true,
          DefaultTTL: 0,
          MaxTTL: 0
        },
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [
            {
              DomainName: `${this.bucketName}.s3-website-${this.appConfig.vars.AWS_REGION}.amazonaws.com`,
              Id: this.bucketName,
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443,
                OriginProtocolPolicy: 'http-only',
              },
              OriginPath: ''  // Removemos la ruta del origen
            }
          ]
        },
        HttpVersion: 'http2',
        DefaultRootObject: 'index.html',
        Comment: `Distribution for ${this.bucketName}`,
        PriceClass: 'PriceClass_100',
        CustomErrorResponses: {
          Quantity: 2,  // Cambiado a 2 para manejar 403 y 404
          Items: [
            {
              ErrorCode: 403,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 0
            },
            {
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 0
            }
          ]
        },
      }
    };
  
    try {
      const command = new CreateDistributionCommand(params);
      const response = await this.cloudFrontClient.send(command);
      console.log(`CloudFront distribution created with ID: ${response.Distribution.Id}`);
      console.log('Please update your DISTRIBUTION_ID environment variable with this value.');
      return response.Distribution.Id;
    } catch (error) {
      console.error('Error creating CloudFront distribution:', error);
      throw error;
    }
  }

  async updateCloudFrontDistribution(distributionId, retryCount = 0) {
    console.log('Updating CloudFront distribution...');
  
    if (retryCount >= 3) {
      throw new Error('Max retry attempts reached for updating CloudFront distribution');
    }
  
    try {
      const { Distribution } = await this.cloudFrontClient.send(new GetDistributionCommand({ Id: distributionId }));
  
      const newConfig = {
        ...Distribution.DistributionConfig,
        DefaultCacheBehavior: {
          ...Distribution.DistributionConfig.DefaultCacheBehavior,
          ViewerProtocolPolicy: 'redirect-to-https',
          ForwardedValues: {
            QueryString: false,
            Cookies: { Forward: 'none' }
          },
          MinTTL: 0,
          DefaultTTL: 0,
          MaxTTL: 0,
          SmoothStreaming: false,
          Compress: true,
          AllowedMethods: {
            Quantity: 3,
            Items: ["HEAD", "GET", "OPTIONS"],
            CachedMethods: {
              Quantity: 2,
              Items: ["HEAD", "GET"]
            }
          }
        },
        Origins: {
          Quantity: 1,
          Items: [
            {
              DomainName: `${this.bucketName}.s3-website-${this.appConfig.vars.AWS_REGION}.amazonaws.com`,
              Id: this.bucketName,
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443,
                OriginProtocolPolicy: 'http-only',
              },
              OriginPath: ''
            }
          ]
        },
        CustomErrorResponses: {
          Quantity: 2,  // Cambiado a 2 para manejar 403 y 404
          Items: [
            {
              ErrorCode: 403,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 0
            },
            {
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 0
            }
          ]
        },
        DefaultRootObject: 'index.html',
        Enabled: true,
        HttpVersion: 'http2',
        PriceClass: 'PriceClass_100'
      };
  
      newConfig.CallerReference = Distribution.DistributionConfig.CallerReference;
      newConfig.Comment = Distribution.DistributionConfig.Comment || `Updated distribution for ${this.bucketName}`;
  
      const updateParams = {
        Id: distributionId,
        DistributionConfig: newConfig,
        IfMatch: Distribution.ETag
      };
  
      const updateCommand = new UpdateDistributionCommand(updateParams);
      await this.cloudFrontClient.send(updateCommand);
      console.log(`CloudFront distribution ${distributionId} updated successfully.`);
    } catch (error) {
      console.error('Error updating CloudFront distribution:', error);
      if (error.name === 'NoSuchDistribution') {
        throw error;
      }
      if (error.name === 'PreconditionFailed' || error.name === 'InvalidIfMatchVersion') {
        console.log('ETag mismatch or invalid. Retrying with fresh data...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.updateCloudFrontDistribution(distributionId, retryCount + 1);
      }
      console.log(`Retrying update... (Attempt ${retryCount + 1})`);
      await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
      return this.updateCloudFrontDistribution(distributionId, retryCount + 1);
    }
  }
}
