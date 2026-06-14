import asyncio
import base64
import json
import os
import sys
from datetime import datetime, timedelta, timezone
import secrets
from flask import Flask, jsonify, request, render_template
import httpx
from Crypto.Cipher import AES
from google.protobuf.json_format import ParseDict, MessageToJson
from google.protobuf import descriptor as _descriptor
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf import symbol_database as _symbol_database
from google.protobuf.internal import builder as _builder
import psycopg2
from dotenv import load_dotenv

# Load env variables
load_dotenv()

# === Proto Setup ===
_runtime_version.ValidateProtobufRuntimeVersion(
    _runtime_version.Domain.PUBLIC, 6, 30, 0, '', 'FreeFire.proto'
)
_sym_db = _symbol_database.Default()
DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b'\n\x0e\x46reeFire.proto\"c\n\x08LoginReq\x12\x0f\n\x07open_id\x18\x16 \x01(\t\x12\x14\n\x0copen_id_type\x18\x17 \x01(\t\x12\x13\n\x0blogin_token\x18\x1d \x01(\t\x12\x1b\n\x13orign_platform_type\x18\x63 \x01(\t\"]\n\x10\x42lacklistInfoRes\x12\x1e\n\nban_reason\x18\x01 \x01(\x0e\x32\n.BanReason\x12\x17\n\x0f\x65xpire_duration\x18\x02 \x01(\r\x12\x10\n\x08\x62\x61n_time\x18\x03 \x01(\r\"f\n\x0eLoginQueueInfo\x12\r\n\x05\x61llow\x18\x01 \x01(\x08\x12\x16\n\x0equeue_position\x18\x02 \x01(\r\x12\x16\n\x0eneed_wait_secs\x18\x03 \x01(\r\x12\x15\n\rqueue_is_full\x18\x04 \x01(\x08\"\xa0\x03\n\x08LoginRes\x12\x12\n\naccount_id\x18\x01 \x01(\x04\x12\x13\n\x0block_region\x18\x02 \x01(\t\x12\x13\n\x0bnoti_region\x18\x03 \x01(\t\x12\x11\n\tip_region\x18\x04 \x01(\t\x12\x19\n\x11\x61gora_environment\x18\x05 \x01(\t\x12\x19\n\x11new_active_region\x18\x06 \x01(\t\x12\x19\n\x11recommend_regions\x18\x07 \x03(\t\x12\r\n\x05token\x18\x08 \x01(\t\x12\x0b\n\x03ttl\x18\t \x01(\r\x12\x12\n\nserver_url\x18\n \x01(\t\x12\x16\n\x0e\x65mulator_score\x18\x0b \x01(\r\x12$\n\tblacklist\x18\x0c \x01(\x0b\x32\x11.BlacklistInfoRes\x12#\n\nqueue_info\x18\r \x01(\x0b\x32\x0f.LoginQueueInfo\x12\x0e\n\x06tp_url\x18\x0e \x01(\t\x12\x15\n\rapp_server_id\x18\x0f \x01(\r\x12\x0f\n\x07\x61no_url\x18\x10 \x01(\t\x12\x0f\n\x07ip_city\x18\x11 \x01(\t\x12\x16\n\x0eip_subdivision\x18\x12 \x01(\t*\xa8\x01\n\tBanReason\x12\x16\n\x12\x42\x41N_REASON_UNKNOWN\x10\x00\x12\x1b\n\x17\x42\x41N_REASON_IN_GAME_AUTO\x10\x01\x12\x15\n\x11\x42\x41N_REASON_REFUND\x10\x02\x12\x15\n\x11\x42\x41N_REASON_OTHERS\x10\x03\x12\x16\n\x12\x42\x41N_REASON_SKINMOD\x10\x04\x12 \n\x1b\x42\x41N_REASON_IN_GAME_AUTO_NEW\x10\xf6\x07\x62\x06proto3'
)
_globals = globals()
_builder.BuildMessageAndEnumDescriptors(DESCRIPTOR, _globals)
_builder.BuildTopDescriptorsAndMessages(DESCRIPTOR, 'FreeFire_pb2', _globals)
LoginReq = _globals['LoginReq']
LoginRes = _globals['LoginRes']

# === Config ===
MAIN_KEY = base64.b64decode('WWcmdGMlREV1aDYlWmNeOA==')
MAIN_IV = base64.b64decode('Nm95WkRyMjJFM3ljaGpNJQ==')
USERAGENT = "Dalvik/2.1.0 (Linux; U; Android 13; CPH2095 Build/RKQ1.211119.001)"
RELEASEVERSION = "OB53"

# Environment Variables Validation
VALID_API_KEY = os.environ.get("VALID_API_KEY")
ADMIN_KEY = os.environ.get("ADMIN_KEY")
DATABASE_URL = os.environ.get("DATABASE_URL")

if not VALID_API_KEY or not ADMIN_KEY or not DATABASE_URL:
    missing = []
    if not VALID_API_KEY: missing.append("VALID_API_KEY")
    if not ADMIN_KEY: missing.append("ADMIN_KEY")
    if not DATABASE_URL: missing.append("DATABASE_URL")
    print(f"CRITICAL ERROR: Missing environment variable(s): {', '.join(missing)}", file=sys.stderr)
    print("For purchase api key contact with @saeedxdie on Telegram or instagram", file=sys.stderr)
    sys.exit(1)

# Initialize Database Connection Helper
def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

# Verify database connection and create table on startup
try:
    conn = get_db_connection()
    with conn.cursor() as cur:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS api_keys (
                key VARCHAR(255) PRIMARY KEY,
                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(50) DEFAULT 'active'
            );
        """)
        conn.commit()
    conn.close()
except Exception as e:
    print(f"CRITICAL ERROR: Failed to connect to Neon PostgreSQL database: {e}", file=sys.stderr)
    print("For purchase api key contact with @saeedxdie on Telegram or instagram", file=sys.stderr)
    sys.exit(1)

# === Crypto ===
def pad(data: bytes) -> bytes:
    pad_len = AES.block_size - len(data) % AES.block_size
    return data + bytes([pad_len] * pad_len)

def aes_encrypt(data: bytes) -> bytes:
    cipher = AES.new(MAIN_KEY, AES.MODE_CBC, MAIN_IV)
    return cipher.encrypt(pad(data))

# === Protobuf Build ===
def build_login_request(open_id: str, login_token: str) -> bytes:
    msg = LoginReq()
    ParseDict({
        "open_id": open_id,
        "open_id_type": "4",
        "login_token": login_token,
        "orign_platform_type": "4"
    }, msg)
    return msg.SerializeToString()

# === Get Access Token ===
async def get_access_token(uid: str, password: str):
    url = "https://100067.connect.garena.com/oauth/guest/token/grant"
    headers = {
        "Host": "100067.connect.garena.com",
        "User-Agent": "GarenaMSDK/4.0.19P4(G011A ;Android 10;en;EN;)",
        "Content-Type": 'application/x-www-form-urlencoded',
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "close",
    }
    payload = (
        f"uid={uid}&password={password}"
        + "&response_type=token"
        + "&client_type=2"
        + "&client_secret=2ee44819e9b4598845141067b281621874d0d5d7af9d8f7e00c1e54715b7d1e3"
        + "&client_id=100067"
    )

    async with httpx.AsyncClient() as client:
        response = await client.post(url, data=payload, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()
        return data.get("access_token"), data.get("open_id")

# === Get JWT Token ===
async def get_jwt(uid: str, password: str):
    access_token, open_id = await get_access_token(uid, password)
    encrypted = aes_encrypt(build_login_request(open_id, access_token))
    url = "https://loginbp.ggpolarbear.com/MajorLogin"
    headers = {
        'User-Agent': USERAGENT,
        'Content-Type': "application/octet-stream",
        'X-Unity-Version': "2018.4.11f1",
        'X-GA': "v1 1",
        'ReleaseVersion': RELEASEVERSION
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=encrypted, headers=headers)
        msg = LoginRes()
        msg.ParseFromString(resp.content)
        response_data = json.loads(MessageToJson(msg))
        response_data.pop("ttl", None) # Remove ttl if it exists
        response_data.pop("anoUrl", None) # Remove anoUrl if it exists

        # Reorder keys
        ordered_response = {
            "accountId": response_data.get("accountId"),
            "agoraEnvironment": response_data.get("agoraEnvironment"),
            "ipRegion": response_data.get("ipRegion"),
            "lockRegion": response_data.get("lockRegion"),
            "notiRegion": response_data.get("notiRegion"),
            "serverUrl": response_data.get("serverUrl"),
            "accessToken": access_token,
            "token": response_data.get("token")
        }
        return ordered_response

# === Flask App ===
app = Flask(__name__)

@app.route('/')
def index():
    """Serve the frontend dashboard"""
    return render_template('index.html')

@app.route('/v1/auth/<string:apikey>', methods=["GET"])
def auth_route(apikey):
    # API key validation
    if apikey == VALID_API_KEY:
        # Master key is valid
        pass
    else:
        # Check database for key validity
        try:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT expires_at, status FROM api_keys WHERE key = %s",
                    (apikey,)
                )
                row = cur.fetchone()
                if not row:
                    conn.close()
                    return jsonify({
                        "error": "Invalid API key. For purchase api key contact with @saeedxdie on Telegram or instagram"
                    }), 401
                
                expires_at, status = row
                now = datetime.now(timezone.utc)
                if status != 'active' or now > expires_at:
                    conn.close()
                    return jsonify({
                        "error": "API key has expired or is invalid. For purchase api key contact with @saeedxdie on Telegram or instagram"
                    }), 401
            conn.close()
        except Exception as e:
            return jsonify({"error": f"Database verification error: {str(e)}"}), 500

    uid = request.args.get('uid')
    password = request.args.get('password')

    if not uid or not password:
        return jsonify({"error": "Missing uid or password."}), 400

    try:
        data = asyncio.run(get_jwt(uid, password))
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# === Admin Routes ===
@app.route('/v1/admin/create-key', methods=["GET", "POST"])
def create_key():
    admin_key = request.headers.get("X-Admin-Key") or request.args.get("admin_key")
    if admin_key != ADMIN_KEY:
        return jsonify({"error": "Unauthorized admin access."}), 401

    try:
        duration_str = request.args.get("duration") or (request.json.get("duration") if request.is_json else None)
        duration = int(duration_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid duration. Must be an integer representing days (1, 3, 7, or 30)."}), 400

    if duration not in [1, 3, 7, 30]:
        return jsonify({"error": "Invalid duration. Supported lifespans: 1, 3, 7, 30 days."}), 400

    new_key = "saeed_" + secrets.token_hex(12)
    expires_at = datetime.now(timezone.utc) + timedelta(days=duration)

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO api_keys (key, expires_at, status) VALUES (%s, %s, %s)",
                (new_key, expires_at, 'active')
            )
            conn.commit()
        conn.close()
        return jsonify({
            "status": "success",
            "key": new_key,
            "duration_days": duration,
            "expires_at": expires_at.isoformat()
        })
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/v1/admin/list-keys', methods=["GET"])
def list_keys():
    admin_key = request.headers.get("X-Admin-Key") or request.args.get("admin_key")
    if admin_key != ADMIN_KEY:
        return jsonify({"error": "Unauthorized admin access."}), 401

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT key, expires_at, created_at, status FROM api_keys ORDER BY created_at DESC")
            rows = cur.fetchall()
            
            keys_list = []
            for row in rows:
                keys_list.append({
                    "key": row[0],
                    "expires_at": row[1].isoformat() if row[1] else None,
                    "created_at": row[2].isoformat() if row[2] else None,
                    "status": row[3]
                })
        conn.close()
        return jsonify({"keys": keys_list})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

@app.route('/v1/admin/revoke-key', methods=["GET", "POST"])
def revoke_key():
    admin_key = request.headers.get("X-Admin-Key") or request.args.get("admin_key")
    if admin_key != ADMIN_KEY:
        return jsonify({"error": "Unauthorized admin access."}), 401

    target_key = request.args.get("key") or (request.json.get("key") if request.is_json else None)
    if not target_key:
        return jsonify({"error": "Missing key to revoke."}), 400

    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE api_keys SET status = 'revoked' WHERE key = %s",
                (target_key,)
            )
            conn.commit()
            rowcount = cur.rowcount
        conn.close()
        
        if rowcount == 0:
            return jsonify({"error": "Key not found."}), 404
            
        return jsonify({"status": "success", "message": f"Key {target_key} has been revoked."})
    except Exception as e:
        return jsonify({"error": f"Database error: {str(e)}"}), 500

# === Run ===
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
