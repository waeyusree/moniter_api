const mysql = require('mysql');
const queryBuilder = require('node-querybuilder');

/** === start mysql === */
// กำหนดการเชื่อมต่อฐานข้อมู
const db = mysql.createConnection({
    host: 'localhost',
    user: 'admin',
    password: '1234',
    database: 'moniter',
    port: '6033'

});

// ทำการเชื่อมต่อกับฐานข้อมูล 
db.connect(function(err) {

    if(err){ // กรณีเกิด error
        // console.error('error: ' + err.message);
        console.error('error connecting: ' + err.stack)
        return
    }

    // console.log('Connected to the MySQL server.');
    // console.log('connected as id ' + db.threadId)
});

// ปิดการเชื่อมต่อฐานข้อมูล MySQL ในที่นี้เราจะไม่ให้ทำงาน
// db.end()
/** === end mysql === */

/** === start queryBuilder === */
const settings = {
    host: 'localhost',
    database: 'moniter',
    user: 'admin',
    password: '1234',
    port: '6033'
};

const pool = new queryBuilder(settings, 'mysql', 'pool');

// console.log(pool);
/** === end queryBuilder === */

module.exports = { db, pool };