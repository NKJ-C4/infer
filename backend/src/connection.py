import snowflake.connector
import boto3
import json
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import serialization
from botocore.exceptions import ClientError










def get_secret():
    """To fetch the secret from secrets manager."""
    # Secrets config
    secret_name = 'roi/snf_access'
    region_name = 'us-west-2'

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    secrets = {}
    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        raise e
    else:
        if "SecretString" in get_secret_value_response:
            secrets.update(json.loads(get_secret_value_response["SecretString"]))
        else:
            logging.info("Binary secret is present yet uncollected")

    return secrets


def get_snowflake_connection(secrets):
    """Establish a connection to Snowflake using credentials retrieved from AWS Secrets Manager."""
    result_1 = secrets["snf_rsa"][1:-1]
    key = ""
    ls = list(result_1.split(", "))
    for x in ls:
        keyLine = x[1:-1]
        key += keyLine
        key += "\n"

    def remove_last_line_from_string(s):
        return s[: s.rfind("\n")]

    wellformmatedkey = remove_last_line_from_string(key)

    p_key = serialization.load_pem_private_key(
        wellformmatedkey.encode("utf-8"), secrets["snf_passphrase"].encode("utf-8"), backend=default_backend()
    )

    pkb = p_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    conn_par = snowflake.connector.connect(
        user=secrets["snf_username"],
        account=secrets["snf_account"],
        private_key=pkb,
        warehouse='PET_PROD_WH',
        database='PET_PROD_DB',
        schema='HACKBOT_DEMO_SCHEMA',
        role=secrets["role"],
    )

    return conn_par