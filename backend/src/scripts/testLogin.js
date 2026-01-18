const http = require("http");

function testLogin(email, password) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/auth/login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  const testUsers = [
    { email: "admin@wms.com", password: "admin123" },
    { email: "manager@wms.com", password: "manager123" },
    { email: "operator@wms.com", password: "operator123" },
  ];

  console.log("Testing login endpoint...\n");

  for (const user of testUsers) {
    try {
      const result = await testLogin(user.email, user.password);
      if (result.status === 200) {
        console.log(`✅ ${user.email}: SUCCESS`);
        console.log(`   Token: ${result.data.token ? "Received" : "Missing"}`);
        console.log(`   Role: ${result.data.user?.role}\n`);
      } else {
        console.log(`❌ ${user.email}: FAILED`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.data.message || result.data}\n`);
      }
    } catch (error) {
      console.log(`❌ ${user.email}: ERROR`);
      console.log(`   ${error.message}\n`);
    }
  }
}

main();
