curl -v -X POST 'http://localhost:8000/api/v1/tenants/' -H 'accept: application/json' -H 'Content-Type: application/json' -H 'Authorization: Bearer YOUR_TOKEN' -d '{\
name\: \测试租户\, \status\: \active\, \contact_name\: \测试联系人\, \contact_email\: \test@example.com\, \contact_phone\: \13700137000\}'
