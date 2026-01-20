#!/usr/bin/env python3
"""Quick test script to diagnose Resend API issues"""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "notifications@revtrust.com")

print("=" * 60)
print("RESEND API TEST")
print("=" * 60)
print(f"FROM_EMAIL: {FROM_EMAIL}")
print(f"API_KEY configured: {bool(RESEND_API_KEY)}")
if RESEND_API_KEY:
    print(f"API_KEY preview: {RESEND_API_KEY[:8]}...{RESEND_API_KEY[-4:]}")
print("=" * 60)

if not RESEND_API_KEY:
    print("❌ RESEND_API_KEY not found in environment")
    exit(1)

# Test email payload
payload = {
    "from": FROM_EMAIL,
    "to": ["sales@revtrust.net"],
    "reply_to": ["test@test.com"],
    "subject": "Test Email - Contact Form",
    "html": "<h1>Test Email</h1><p>This is a test email from the contact form.</p>"
}

print("\n📧 Sending test email...")
print(f"   From: {payload['from']}")
print(f"   To: {payload['to']}")
print(f"   Subject: {payload['subject']}")

try:
    with httpx.Client() as client:
        response = client.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json"
            },
            json=payload,
            timeout=10.0
        )

        print(f"\n📨 Response Status: {response.status_code}")
        print(f"📨 Response Headers: {dict(response.headers)}")
        print(f"📨 Response Body: {response.text}")

        if response.status_code == 200:
            print("\n✅ SUCCESS! Email sent successfully!")
            data = response.json()
            print(f"   Email ID: {data.get('id')}")
        else:
            print(f"\n❌ FAILED! Status code: {response.status_code}")

            # Parse error details
            try:
                error_data = response.json()
                print(f"\n❌ Error Details:")
                for key, value in error_data.items():
                    print(f"   {key}: {value}")
            except:
                print(f"   Raw response: {response.text}")

            # Common issues
            print("\n💡 Common Issues:")
            if response.status_code == 422:
                print("   - FROM_EMAIL domain may not be verified in Resend")
                print("   - Check https://resend.com/domains")
                print(f"   - Current FROM_EMAIL: {FROM_EMAIL}")
            elif response.status_code == 401:
                print("   - RESEND_API_KEY may be invalid or revoked")
                print("   - Check https://resend.com/api-keys")
            elif response.status_code == 403:
                print("   - Domain not verified or permission denied")
                print("   - Check domain verification in Resend dashboard")

except Exception as e:
    print(f"\n❌ Exception occurred: {type(e).__name__}")
    print(f"   {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
