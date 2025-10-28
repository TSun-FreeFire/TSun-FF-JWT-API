
# 🎮 FreeFire JWT API

A lightweight, asynchronous Flask-based API that emulates Free Fire’s login process to return account ***JWT Token*** in real-time.  
Built using **Protobuf**, **AES encryption**, and **async HTTPX** for maximum accuracy and performance.

---

## 🚀 Features

✅ AES-Encrypted Login Request  
✅ Protobuf Parsing (LoginRes)  
✅ Region, Token, and Ban Info Extraction  
✅ Fast Async I/O with `httpx`  
✅ Built-in API Key Security  
✅ Clean JSON Response  

---

## 🧠 How It Works

This API simulates the Free Fire login handshake by:
1. Requesting a Garena OAuth token using provided credentials.
2. Building an encrypted protobuf payload.
3. Sending the payload to the official Garena login server.
4. Decoding and returning the structured response as JSON.

---

## 📂 Folder Structure

```

📦 FreeFire-Login-API
┣ 📜 app.py
┣ 📜 FreeFire.proto
┣ 📜 requirements.txt
┗ 📜 README.md

````

---

## ⚙️ Installation

### Step 1 — Clone Repository
```bash
git clone https://github.com/TSun-FreeFire/TSun-FreeFire-JWT-API.git
cd TSun-FreeFire-JWT-API
````

### Step 2 — Install Dependencies

```bash
pip install flask httpx pycryptodome protobuf
```

### Step 3 — Run Server

```bash
python app.py
```

---

## 🔑 Endpoint

### **GET /v1/auth/<Uid:password>/apikey**

**Example Request:**

```
http://127.0.0.1:5000/v1/auth/123456789:abcdef/saeed
```

**Example Response:**

```json
{
  "accountId": "13678722441",
  "agoraEnvironment": "live",
  "anoUrl": "csoversea.stronghold.freefiremobile.com",
  "ipRegion": "PK",
  "lockRegion": "PK",
  "notiRegion": "SG",
  "serverUrl": "https://clientbp.ggwhitehawk.com",
  "token": "eyJhbGciOiJIUzI1NiIsInN2ciI6IjEiLCJ0....",
  "ttl": 28800
}
```

**Error Responses:**

```json
{
  "error": "Error parsing message with type 'LoginRes'"
}
```

```json
{
  "error": "Invalid format. Use id:pass"
}
```

---

## 🧩 Environment Variables (Optional)

You can modify the following in `app.py`:

```python
VALID_API_KEY = "saeed"  #Line:33
RELEASEVERSION = "OB50" #Line:32
```

---

## 🛡️ Security Notes

* API key check prevents unauthorized access.
* Use in a secure environment only (localhost or private server).
* Do **not** expose Garena credentials publicly.

---

## 🌍 Author

**Developed By:** [༯𝙎ค૯𝙀𝘿✘🫀](https://github.com/saeedx302)

**Team:** [TSun FreeFire](https://github.com/TSun-FreeFire)

---

### 🧷 License

This project is open-source for educational and research use only.
Unauthorized or commercial misuse of Garena endpoints is strictly discouraged.

---

```
