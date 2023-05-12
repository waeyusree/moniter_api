const { pool } = require('../config/db');

async function HostList() {

    const qb = await pool.get_connection();
    try {
        const response = await qb.select('*')
            .get('lp_host');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", response);
            // return

            if(response)
            {
                return response;
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.release();
    }

    return false;
}

async function HostDetail(hostId) {

    const qb = await pool.get_connection();
    try {
        const response = await qb.select('*')
            .where({id : hostId})
            .get('lp_host');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", response);
            // return

            if(response)
            {
                return response[0];
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.release();
    }

    return false;
}

async function GetHostListByProjectId(projectId) {

    // console.log(444)
    const qb = await pool.get_connection();

    try {
        const response = await qb.select('*')
            .where({
                project_id : projectId,
                is_active : 1, // เปิด
                // is_active : 0, // ปิด
            })
            // .limit(1)
            .get('lp_host');

            // console.log(555)

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", response);

            if(response)
            {
                return response;
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        await qb.release();
    }

    return false;
}

module.exports = { HostList, HostDetail, GetHostListByProjectId };