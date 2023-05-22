const Moment    = require('moment');
const { pool } = require('../config/db');

/** === Start manage data === **/
async function ProjectAdd(data){

    const qb = await pool.get_connection();
    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            create_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.insert('lp_project', dataAssign);
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

async function ProjectUpdate(projectId, data){

    const qb = await pool.get_connection();
    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            update_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.update('lp_project', dataAssign, {id : projectId});

        if (results.changed_rows === 1) {
            return projectId;
        } 
    } catch (err) {
        console.error(err);
    } finally {
        qb.release();
    }

    return false;
}

async function ProjectDelete(projectId){

    const qb = await pool.get_connection();
    try {
  
        const results = await qb.delete('lp_project', {id: projectId});
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
async function ProjectList() {

    const qb = await pool.get_connection();
    try {
        const results = await qb.select('*')
            .get('lp_project');

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

async function ProjectDetail(projectId) {

    const qb = await pool.get_connection();
    try {
        const results = await qb.select('*')
            .where({id : projectId})
            .get('lp_project');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", results);
            // return

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
/** === End look up data === **/

module.exports = { ProjectAdd, ProjectUpdate, ProjectDelete, ProjectList, ProjectDetail };