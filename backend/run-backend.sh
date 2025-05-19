#!/bin/bash

# Check if the secrets file exists
if [ ! -f "cli-secrets.txt" ]; then
    echo "Error: cli-secrets.txt file is missing"
    exit 1
fi

while IFS='=' read -r key value; do
    # Remove any whitespace and quotes
    key=$(echo "$key" | tr -d ' ')
    value=$(echo "$value" | tr -d ' ' | tr -d '"' | tr -d "'")
    
    # Convert to uppercase for AWS environment variables
    case "$key" in
        "aws_access_key_id")
            export AWS_ACCESS_KEY_ID=$value
            ;;
        "aws_secret_access_key")
            export AWS_SECRET_ACCESS_KEY=$value
            ;;
        "aws_session_token")
            export AWS_SESSION_TOKEN=$value
            ;;
    esac
done < cli-secrets.txt

export AWS_DEFAULT_REGION="us-east-1"

echo "AWS credentials loaded:"
echo "Access Key ID: ${AWS_ACCESS_KEY_ID}"
echo "Secret Access Key: ${AWS_SECRET_ACCESS_KEY}"
echo "Session Token is set: ${AWS_SESSION_TOKEN}"

# Verify AWS configuration
echo -e "\nTesting AWS credentials..."
aws s3 ls

if [ $? -eq 0 ]; then
    echo -e "\nAWS credentials verified successfully!"
    echo "Starting uvicorn app..."
    source venv/bin/activate
    uvicorn app.main:app --reload
else
    echo "Error: AWS credential verification failed"
    exit 1
fi