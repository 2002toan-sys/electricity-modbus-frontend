#!/bin/sh
# entrypoint.sh - Nạp cấu hình nội tuyến (inline) thẳng vào index.html để tránh lỗi Cache

node -e "
const fs = require('fs');
const env = {};
for (const key in process.env) {
    if (key.startsWith('REACT_APP_')) {
        env[key] = process.env[key];
    }
}

const scriptTag = '<script id=\"runtime-env\">window._env_ = ' + JSON.stringify(env) + ';</script>';

try {
    let indexHTML = fs.readFileSync('/app/build/index.html', 'utf8');
    
    // Xoá tag script trỏ tới file env-config.js (Gây lỗi Loading Cache trên trình duyệt cũ)
    indexHTML = indexHTML.replace(/<script[^>]*src=\"[^\"]*env-config\.js\"[^>]*><\/script>/gi, scriptTag);
    
    // Nếu container start lại, thay thế đoạn script inline cũ
    indexHTML = indexHTML.replace(/<script id=\"runtime-env\">.*?<\/script>/gi, scriptTag);
    
    fs.writeFileSync('/app/build/index.html', indexHTML);
    console.log('✅ Da tim thay va Nap thanh cong Bien moi truong tu Docker Compose vao App:');
    console.log(JSON.stringify(env, null, 2));
} catch (e) {
    console.error('Loi khi doc hoac ghi file index.html:', e.message);
}
"

# Khởi chạy lệnh dưới CMD của Dockerfile (serve)
exec "$@"
