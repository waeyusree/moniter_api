const Moment    = require('moment');
const { pool } = require('../config/db');

/** === Start manage data === **/

async function HostAdd(data){

    const qb = await pool.get_connection();
    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            create_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.insert('lp_host', dataAssign);
        if (results.affected_rows === 1) {
            return results.insert_id;
        } 
    } catch (err) {
        console.error(err);
    } finally {
        qb.release();
    }

    return false;
}

async function HostUpdate(hostId, data){

    const qb = await pool.get_connection();
    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            update_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.update('lp_host', dataAssign, {id : hostId});

        if (results.changed_rows === 1) {
            return hostId;
        } 
    } catch (err) {
        console.error(err);
    } finally {
        qb.release();
    }

    return false;
}

async function HostDelete(hostId){

    const qb = await pool.get_connection();
    try {
  
        const results = await qb.delete('lp_host', {id: hostId});
        if (results.affected_rows === 1) {
            return results.affected_rows ;
        }
    } catch (err) {
        console.error(err);
    } finally {
        qb.release();
    }
    
    return false;
}
/** === End manage data === **/

/** ========================== */

/** === Start look up data === **/
async function HostList() {

    const qb = await pool.get_connection();
    try {
        const results = await qb.select('*')
            .get('lp_host');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", results);
            // return

            if(results)
            {
                return results;
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
        const results = await qb.select('*')
            .where({id : hostId})
            .get('lp_host');
            
            if(results)
            {
                return results[0];
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
        const results = await qb.select('*')
            .where({
                project_id : projectId,
                is_active : 1, // เปิด
                // is_active : 0, // ปิด
            })
            // .limit(1)
            .get('lp_host');

            // console.log(555)

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", results);

            if(results)
            {
                return results;
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        await qb.release();
    }

    return false;
}
/** === End look up data === **/

module.exports = { HostAdd, HostUpdate, HostDelete, HostList, HostDetail, GetHostListByProjectId };