# InfraVision

Sketch-to-AWS CloudFormation starter built with Next.js 14 and the current Gemini SDK Interactions API. The app includes sketch analysis, a native SVG architecture flow view, a Well-Architected audit, CloudFormation deployment, a one-retry Gemini repair loop, and stack deletion.

The interface uses a bright porcelain/periwinkle/aqua palette with a cursor spotlight blueprint, animated scroll progress, floating 3D architecture chips, scroll reveals, and a short deployment-accepted celebration. Motion patterns are implemented with the existing Framer Motion dependency and lightweight CSS, inspired by 21st.dev's interactive card and spotlight collection.

## Run locally

1. Install Node.js 20 or newer and unzip this project.
2. From the `infravision` directory run `npm install`.
3. Copy `.env.example` to `.env.local` and set `GEMINI_API_KEY`. The app tries Gemini 3.8 Flash first and switches to Gemini 3.6 Flash for transient overloads. Set `AWS_REGION` and provide AWS credentials through the AWS SDK credential chain (for example, an AWS profile or an IAM role).
4. Start the app with `npm run dev` and open `http://localhost:3000`.

Generated fallback previews are clearly labeled and cannot be deployed. Real generated templates can be deployed after review. The deployment endpoint creates `InfraVisionStack`, updates it when it already exists, and retries once with Gemini after a CloudFormation template error. The destroy button requests deletion of that stack. AWS credentials need permission for the CloudFormation actions and the resources in the reviewed template.

Do not commit `.env.local` or expose API credentials in client-side code.

## AWS deployment permissions

The AWS identity used by the Next.js server needs CloudFormation permissions to create, update, inspect, and delete `InfraVisionStack`. It also needs permissions for the resources declared in the template. CloudFormation stack permissions alone do not grant permission to create S3, Lambda, DynamoDB, or IAM resources. If the template creates IAM roles, grant the applicable IAM actions and `iam:PassRole`, or use a reviewed CloudFormation execution role. The deploy API returns authorization failures immediately; Gemini repair is reserved for recognizable template-format errors.
