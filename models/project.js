const Moment    = require('moment');

/** === Start manage data === **/
async function ProjectAdd(qb, data){

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
    }

    return;
}

async function ProjectUpdate(qb, projectId, data){

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
    } 

    return;
}

async function ProjectDelete(qb, projectId){

    try {
  
        const results = await qb.delete('lp_project', {id: projectId});
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
async function ProjectList(qb, condition = null) {

    try {
        // const conditionWhere = Object.assign({}, condition);

        // let sql_where = '';
        // if(conditionWhere)
        // {
        //     sql_where = ' WHERE ' + qb.escape(conditionWhere);
        // }

        // const sql = 'SELECT * FROM `lp_project`' + sql_where + ' ORDER BY `id`';
        // // qb.query(sql, (err, res) => {
        // //     console.log(res);
        // // });

        // const results = await qb.query(sql);
        // if(results)
        // {
        //     return results;
        // }

        let results = '';
        if(condition)
        {
            results = await qb.select('*')
            .where(condition)
            // .where({
            //     // is_active : 1, // เปิด
            //     // is_active : 0, // ปิด
            // })
            // .limit(1)
            .get('lp_project');
        }
        else
        {
            results = await qb.select('*')
            .get('lp_project');
        }

        if(results)
        {
            return results;
        }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results : " + err.msg);
    }

    return;
}

async function ProjectDetail(qb, projectId) { 
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
    }

    return;
}
/** === End look up data === **/

module.exports = { ProjectAdd, ProjectUpdate, ProjectDelete, ProjectList, ProjectDetail };