const Moment    = require('moment');

/** === Start manage data === **/

async function HostAdd(qb, data){

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
    } 

    return;
}

async function HostUpdate(qb, hostId, data){

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
    } 

    return;
}

async function HostDelete(qb, hostId){

    try {
  
        const results = await qb.delete('lp_host', {id: hostId});
        if (results.affected_rows === 1) {
            return results.affected_rows ;
        }
    } catch (err) {
        console.error(err);
    }
    
    return;
}
/** === End manage data === **/

/** ========================== */

/** === Start look up data === **/
async function HostList(qb) {

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
    } 
    
    return;
}

async function HostDetail(qb, hostId) {

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
    } 

    return;
}

async function HostListByProjectId(qb, projectId, data = null) {

    const dataAssign = {
        project_id : projectId,
    }

    /*** === merge data === */
    if(data)
    {
        Object.assign(dataAssign, data);
    }
  
    try {
        const results = await qb.select('*')
            .where(dataAssign)
            // .where({
            //     project_id : projectId,
            //     // is_active : 1, // เปิด
            //     // is_active : 0, // ปิด
            // })
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
    }

    return;
}


async function HostHistoryCountUpDown(qb, hostId) {

    try {
        const sql = 'SELECT is_status, COUNT(`is_status`) AS `count_status` FROM `lp_host_history` WHERE ' + qb.escape({host_id: hostId}) + 'GROUP BY `is_status`';
        // qb.query(sql, (err, res) => {
        //     console.log(res);
        // });

        const results = await qb.query(sql);
        if(results)
        {
            // console.log(results);
            return results;
        }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    }

    return;
}
/** === End look up data === **/

module.exports = { HostAdd, HostUpdate, HostDelete, HostList, HostDetail, HostListByProjectId, HostHistoryCountUpDown };