const { pool } = require('../config/db');

async function ProjectList() {

    const qb = await pool.get_connection();
    try {
        const response = await qb.select('*')
            .get('lp_project');

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

async function ProjectDetail(projectId) {

    const qb = await pool.get_connection();
    try {
        const response = await qb.select('*')
            .where({id : projectId})
            .get('lp_project');

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



module.exports = { ProjectList, ProjectDetail };