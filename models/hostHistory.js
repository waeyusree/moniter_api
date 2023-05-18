const Moment    = require('moment');
const { pool } = require('../config/db');

async function HostHistoryAdd(hostDetail) {

     const data = {
        project_id  : hostDetail.project_id, 
        host_id     : hostDetail.id,
        machine_name: hostDetail.machine_name,
        duty_id     : hostDetail.duty_id,
        ip_type_id  : hostDetail.ip_type_id,
        public_ip   : hostDetail.public_ip,
        private_ip  : hostDetail.private_ip,
        port        : hostDetail.port,
        is_status   : hostDetail.is_status,
        status      : hostDetail.status,
        sql_type_id : hostDetail.sql_type_id,
        username    : hostDetail.username,
        password    : hostDetail.password,
        my_database : hostDetail.my_database,
        create_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    };

    // console.error(data);
    // return;

    const qb = await pool.get_connection();

    try {
        const results = await qb.insert('lp_host_history', data);

        if (results.affected_rows === 1) {
            return results.insert_id;
            // const user = await qb.get_where('users', {id: results.insert_id});
            // console.log('New User: ', user);
        } else {
            throw new Error("New host history was not added to database!");
        }
    } catch (err) {
        console.error(err);
    } finally {
        qb.release();
    }

    return false;
}

module.exports = { HostHistoryAdd };