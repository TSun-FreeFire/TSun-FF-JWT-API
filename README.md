<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=180&section=header&text=FreeFire%20JWT%20API&fontSize=45&fontAlignY=35&animation=twinkling&fontColor=fff"/>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Flask-2.0+-black?style=for-the-badge&logo=flask"></a>
  <a href="#"><img src="https://img.shields.io/badge/Python-3.10+-blue?style=for-the-badge&logo=python"></a>
  <a href="#"><img src="https://img.shields.io/github/license/tsunstudio/freefire-bancheck?style=for-the-badge&color=purple"></a>
  <a href="#"><img src="https://komarev.com/ghpvc/?username=tsunstudio-bancheck&label=Views&style=for-the-badge&color=brightgreen"></a>
</p>

---

<p align="center">

A lightweight, asynchronous Flask-based API that emulates Free Fire’s login process to return account ***JWT Token*** in real-time.  
Built using **Protobuf**, **AES encryption**, and **async HTTPX** for maximum accuracy and performance.
</p>

---

<div align="center">

## 🚀 Features
</div>

✅ AES-Encrypted Login Request  
✅ Protobuf Parsing (LoginRes)  
✅ Region, Token, and Ban Info Extraction  
✅ Fast Async I/O with `httpx`  
✅ Built-in API Key Security  
✅ Clean JSON Response  

---
<div align="center">

## 🧠 How It Works
</div>

This API simulates the Free Fire login handshake by:
1. Requesting a Garena OAuth token using provided credentials.
2. Building an encrypted protobuf payload.
3. Sending the payload to the official Garena login server.
4. Decoding and returning the structured response as JSON.

---

## 📂 Folder Structure

```

📦 FreeFire-JWT-API
┣ 📜 app.py
┣ 📜 FreeFire.proto
┣ 📜 requirements.txt
┗ 📜 README.md

````

---

## ⚙️ Installation

### Step 1 — Clone Repository
```bash
git clone https://github.com/TSun-FreeFire/TSun-FF-JWT-API.git
cd TSun-FF-JWT-API
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

### **GET /v1/auth/{apikey}?uid={uid}&password={password}**

**Example Request:**

```
http://127.0.0.1:5000/v1/auth/tsun?uid=12345678&password=754NCUB3ZYJNAX1OI24B
```

**Example Response:**

```json
{
  "accessToken": "f9596a1377d3daf61a",
  "accountId": "1234567897",
  "agoraEnvironment": "live",
  "ipRegion": "PK",
  "lockRegion": "PK",
  "notiRegion": "SG",
  "serverUrl": "https://clientbp.ggwhitehawk.com",
  "token": "eyJhbGciOiJIUzI1NiIsInN2ciI6IjEiLCJ0eXAiOiJ"
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
  "error": "Invalid format. Use uid={uid}&password={password}"
}
```

---

## 🧩 Environment Variables (Optional)

You can modify the following in `app.py`:

```python
VALID_API_KEY = "tsun"  #Line:33
RELEASEVERSION = "OB51" #Line:32
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

## 📜 License

This project is licensed under the **MIT License** — feel free to modify and share with credit.

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&height=120&section=footer"/>
</p>

---