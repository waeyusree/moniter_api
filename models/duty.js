const Moment    = require('moment');

/** === Start manage data === **/

async function DutyAdd(qb, data){

    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            create_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.insert('lp_duty', dataAssign);
        if (results.affected_rows === 1) {
            return results.insert_id;
        } 
    } catch (err) {
        console.error(err);
    }

    return false;
}

async function DutyUpdate(qb, dutyId, data){

    try {

        /*** === merge data === */
        const dataAssign = Object.assign({
            update_date : Moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        }, data);

        const results = await qb.update('lp_duty', dataAssign, {id : dutyId});

        if (results.changed_rows === 1) {
            return dutyId;
        } 
    } catch (err) {
        console.error(err);
    } 

    return false;
}

async function DutyDelete(qb, dutyId){

    try {
  
        const results = await qb.delete('lp_duty', {id: dutyId});
        if (results.affected_rows === 1) {
            return results.affected_rows ;
        }
    } catch (err) {
        console.error(err);
    } 
    
    return false;
}
/** === End manage data === **/

/** ========================== */

/** === Start look up data === **/
async function DutyList(qb) {
 
    try {
        const results = await qb.select('*')
            .get('lp_duty');

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

    return false;
}

async function DutyDetail(qb, dutyId) {

    try {
        const results = await qb.select('*')
            .where({id : dutyId})
            .get('lp_duty');
            
            if(results)
            {
                return results[0];
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    }

    return false;
}
/** === End look up data === **/

module.exports = { DutyAdd, DutyUpdate, DutyDelete, DutyList, DutyDetail };