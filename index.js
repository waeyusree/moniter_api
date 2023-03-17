const express   = require('express');
const app       = express();

const request   = require('request');
const cors      = require('cors');

const http      = require('http');
const ping      = require('ping');
const urlStatusCode = require('url-status-code')
// const QueryBuilder = require('node-querybuilder');

const {db, pool} = require('./config/db');
const { join, resolve } = require('path');
const { json, response } = require('express');
const { rejects } = require('assert');


app.use(cors());
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));

// app.set('view engine', 'ejs');
// app.set('views', 'views');
// app.set('view options', { layout: false });

app.get('/', (req, res) => {
    // res.render('index');
    // res.send('Hello World!')

    // console.log(pool);

    

    var hosts = ['202.139.216.210']; // '192.168.1.1', '202.139.216.210', '202.139.216.120' , 'google.com', 'yahoo.com'
    hosts.forEach(function(host){
        // ping.sys.probe(host, function(isAlive){
        //     // var msg = isAlive ? 'host ' + host + ' is alive' : 'host ' + host + ' is dead';
        //     // console.log(msg);
            
        //     res.json({
        //         // status : isAlive? 200 : 500,
        //         // message: isAlive? 'host'+ host +'is alive' : 'host'+ host +'is dead'

        //         data: isAlive
        //     });

        // });

        ping.promise.probe(host)
        .then(function (response) {
            // console.log(response);

            res.json({
                data: response
            });
        });

    });

});

app.get('/check_host_test', (req, res) => {

    // res.render('index');
    // res.send('Hello World!')

    // 142.251.10.106 or www.google.com
    // host = "142.251.10.106"
    // host = "www.google.com"
    // const host = "www.spiceworks.com";
    // const host = "202.139.216.210" // Public IP (test);
    // const host = "192.168.2.21" // Private IP (test);

    const host = "202.139.216.120" // Private IP (test), status : down
    const request = http.get({host: host}, function(response){

        // console.log(response);
        // res.json({
        //     status : response.statusCode,
        //     message: response
        // })

        if( response.statusCode == 200 )
        {
            // console.log("This site is up and running!");

            res.json({
                status : response.statusCode,
                message: 'This site is up and running!'
            })
        }
        else
        {
            // console.log("This site might be down "+response.statusCode);

            res.json({
                status : response.statusCode,
                message: "This site might be down "+response.statusCode
            })
        }
    
    });

    request.on('error', () => {
        // res.status(500).send('boom');

        res.json({
            status : 500,
            message: "boom"
        })

    });
});

app.get('/check_host_old', (req, res) => {

    // const settings = {
    //     host: 'localhost',
    //     database: 'moniter',
    //     user: 'root',
    //     password: ''
    // };
    // const pool = new QueryBuilder(settings, 'mysql', 'pool');
     
    pool.get_connection( qb => {
        qb.select('*')
        // .where({type: 'rocky', 'diameter <': 12000})
        .get('lp_host', (err, response) => {
            // qb.release();
    
            if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);
    
            // SELECT `name`, `position` FROM `lp_host` WHERE `type` = 'rocky' AND `diameter` < 12000
            // console.log("Query Ran: " + qb.last_query());
    
            // [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
            // console.log("Results:", response);

            /** Loop forEach */
            response.forEach( (hostDetail, key) => {

                // console.log(hostDetail.public_ip);

                if(hostDetail.public_ip != '')
                {
                    const host = hostDetail.public_ip 
        
                    const httpRequest =  http.get({host: host}, function(httpResponse){
                        if( httpResponse.statusCode == 200 ||  httpResponse.statusCode == 302)
                        {
                            /** update status */
                            qb.update('lp_host', {'Status': httpResponse.statusCode}, {Id: hostDetail.Id});

                            // res.json({
                            //     status : httpResponse.statusCode,
                            //     message: 'This site is up and running!'
                            // })
                        }
                        else
                        {
                            // res.json({
                            //     status : httpResponse.statusCode,
                            //     message: "This site might be down "+httpResponse.statusCode
                            // })

                            /** update status */
                            qb.update('lp_host', {'Status': httpResponse.statusCode}, {Id: hostDetail.Id});

                            /** start line  notify */
                            const url_line_notification = "https://notify-api.line.me/api/notify";

                            /** เขียน message */
                            const message = 'ชื่อโครงการ : ' + hostDetail.Name_project + '\n ชื่อระบบงาน : ' + hostDetail.machine_name + '\n Public IP : ' + hostDetail.public_ip + '\n Status : ' + httpResponse.statusCode

                            request({
                                method: 'POST',
                                uri: url_line_notification,
                                header: {
                                    'Content-Type': 'multipart/form-data',
                                },
                                auth: {
                                    bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                                },
                                form: {
                                    message: message
                                },
                            }, (err, httpResponse, body) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    // console.log(body)
                                    // res.json({
                                    //     // httpResponse: httpResponse,
                                    //     body: body
                                    // });

                                    // res.send(body)
                                }
                            });
                            /** start line  notify */

                        }
                    });

                    /** === กรณี http error === */
                    httpRequest.on('error', () => {
                        // res.status(500).send('boom');
                
                        /** update status */
                        qb.update('lp_host', {'Status': 500}, {Id: hostDetail.Id});

                         /** start line  notify */
                         const url_line_notification = "https://notify-api.line.me/api/notify";

                         /** เขียน message */
                         const message = 'ชื่อโครงการ : ' + hostDetail.Name_project + '\n ชื่อระบบงาน : ' + hostDetail.machine_name + '\n Public IP : ' + hostDetail.public_ip + '\n Status : 500'

                         request({
                             method: 'POST',
                             uri: url_line_notification,
                             header: {
                                 'Content-Type': 'multipart/form-data',
                             },
                             auth: {
                                 bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                             },
                             form: {
                                 message: message
                             },
                         }, (err, httpResponse, body) => {
                             if (err) {
                                 console.log(err)
                             } else {
                                 // console.log(body)
                                 // res.json({
                                 //     // httpResponse: httpResponse,
                                 //     body: body
                                 // });

                                 // res.send(body)
                             }
                         });
                         /** start line  notify */

                        // res.json({
                        //     status : 500,
                        //     message: "boom"
                        // })
                    });
                    /** === /กรณี http error === */
                }
            
            });
            /** End Loop forEach */

        });

    });

    setTimeout( () => {
        pool.get_connection(qb => {
            qb.select('*')
            .get('lp_host', (err, response) => {
                // qb.release();

                if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

                res.json({
                    status : 200,
                    dataList: response
                })

            });
        });
    }, 1000);

});

app.get('/check_host', (req, res) => {

    // const settings = {
    //     host: 'localhost',
    //     database: 'moniter',
    //     user: 'root',
    //     password: ''
    // };
    // const pool = new QueryBuilder(settings, 'mysql', 'pool');
     
    pool.get_connection( qb => {
        qb.select('*')
        // .where({type: 'rocky', 'diameter <': 12000})
        .get('lp_host', (err, response) => {
            // qb.release();
    
            if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);
    
            // SELECT `name`, `position` FROM `lp_host` WHERE `type` = 'rocky' AND `diameter` < 12000
            // console.log("Query Ran: " + qb.last_query());
    
            // [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
            // console.log("Results:", response);

            /** Loop forEach */
            response.forEach( (hostDetail, key) => {

                // console.log(hostDetail.public_ip);

                if(hostDetail.public_ip !== undefined)
                {
                    const host = hostDetail.public_ip 

                    ping.promise.probe(host)
                    .then(function (pingResponse) {
                        // console.log(pingResponse);
            
                        if(pingResponse.alive === true)
                        {
                            /** update status */
                            qb.update('lp_host', {'status': 200}, {Id: hostDetail.Id});
                        }
                    
                        if(pingResponse.alive === false)
                        {
                            /** update status */
                            qb.update('lp_host', {'status': 500}, {Id: hostDetail.Id});

                            /** start line  notify */
                            const url_line_notification = "https://notify-api.line.me/api/notify";

                            /** เขียน message */
                            // ชื่อโครงการ : ' + hostDetail.Name_project + '\n 
                            const message = 'ชื่อเครื่อง : ' + hostDetail.machine_name + '\n Public IP : ' + hostDetail.public_ip + '\n Status : ' + 500 ;

                            request({
                                method: 'POST',
                                uri: url_line_notification,
                                header: {
                                    'Content-Type': 'multipart/form-data',
                                },
                                auth: {
                                    bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                                },
                                form: {
                                    message: message
                                },
                            }, (err, httpResponse, body) => {
                                if (err) {
                                    console.log(err)
                                } else {
                                    // console.log(body)
                                    // res.json({
                                    //     // httpResponse: httpResponse,
                                    //     body: body
                                    // });

                                    // res.send(body)
                                }
                            });
                            /** start line  notify */
                        }
                    });
                }
            
            });
            /** End Loop forEach */

        });

    });

    setTimeout( () => {
        pool.get_connection(qb => {
            qb.select('*')
            .get('lp_host', (err, response) => {
                // qb.release();

                if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

                res.json({
                    status : 200,
                    dataList: response
                })

            });
        });
    }, 2000);

});

app.get('/check_url', (req, res) => {
   
    // const url = 'https://www.npmjs.com'
    // const url = 'https://localgovtest.egov.go.th/landing'
    const url = 'https://www.amazon.com/error'
    
    urlStatusCode(url, (error, statusCode) => {
        if (error) {
            console.error(error)
        } else {
            // console.log(statusCode)

            if( statusCode == 200 )
            {
                res.json({
                    status : statusCode,
                    message: 'This url is running!'
                })
            }
            else
            {
                res.json({
                    status : statusCode,
                    message: "This url might be down "+statusCode
                })
            }
            
        }
    })
});

app.get('/check_db_mysql', (req, res) => {

    // setup your databse (username & password & databasename)
    var dataDb = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'moniter'
    });

    // console.log(dataDb);

    // check your database connection
    dataDb.connect(function(err) {

        if (err) {
            // res.send(err)
            return console.error('error: ' + err.message);
        }

        // console.log('Connected to the MySQL server.');
        res.json({
            status : 200,
            message: 'Connected to the MySQL server.'
        })
    });

});

app.get('/notify', (req, res) => {

    const url_line_notification = "https://notify-api.line.me/api/notify";

    request({
        method: 'POST',
        uri: url_line_notification,
        header: {
            'Content-Type': 'multipart/form-data',
        },
        auth: {
            bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
        },
        form: {
            message: 'Test Message!'
        },
    }, (err, httpResponse, body) => {
        if (err) {
            console.log(err)
        } else {
            // console.log(body)
            // res.json({
            //     // httpResponse: httpResponse,
            //     body: body
            // });
            res.send(body)
        }
    });

});

/** === Employee === */
app.get('/employee', (req, res) => {
    db.query('select * from employee', (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.send(rows);
        }
    });
});

// ======================== //

app.get('/check_host/:projectId', async (req, res) => {

    const projectId = req.params.projectId;

    await getHostListById(projectId)
    .then((resHostListById) => {
        resHostListById.forEach( async (hostDetail, key) => {

            await processHost(hostDetail);

            // if(hostDetail.public_ip)
            // {
            //     const host = hostDetail.public_ip;
            //     console.log(host);
            // }
        
        });
    });
     
    // pool.get_connection( qb => {
    //     qb.select('*')
    //     .where({project_id: projectId})
    //     // .where({type: 'rocky', 'diameter <': 12000})
    //     .get('lp_host', (err, response) => {
    //         // qb.release();

    //         // console.log("Results:", response);
    
    //         if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);
    
    //         // SELECT `name`, `position` FROM `lp_host` WHERE `type` = 'rocky' AND `diameter` < 12000
    //         // console.log("Query Ran: " + qb.last_query());
    
    //         // [{name: 'Mercury', position: 1}, {name: 'Mars', position: 4}]
    //         // console.log("Results:", response);

    //         /** Loop forEach */
    //         response.forEach( (hostDetail, key) => {

    //             // console.log(hostDetail.public_ip);

    //             if(hostDetail.public_ip !== undefined)
    //             {
    //                 const host = hostDetail.public_ip 

    //                 ping.promise.probe(host)
    //                 .then(function (pingResponse) {
    //                     // console.log(pingResponse);
            
    //                     if(pingResponse.alive === true)
    //                     {
    //                         /** update status */
    //                         qb.update('lp_host', {'status': 200}, {Id: hostDetail.Id});
    //                     }
                    
    //                     if(pingResponse.alive === false)
    //                     {
    //                         /** update status */
    //                         qb.update('lp_host', {'status': 500}, {Id: hostDetail.Id});

    //                         /** start line  notify */
    //                         const url_line_notification = "https://notify-api.line.me/api/notify";

    //                         /** เขียน message */
    //                         // ชื่อโครงการ : ' + hostDetail.Name_project + '\n 
    //                         const message = 'ชื่อเครื่อง : ' + hostDetail.machine_name + '\n Public IP : ' + hostDetail.public_ip + '\n Status : ' + 500 ;

    //                         request({
    //                             method: 'POST',
    //                             uri: url_line_notification,
    //                             header: {
    //                                 'Content-Type': 'multipart/form-data',
    //                             },
    //                             auth: {
    //                                 bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
    //                             },
    //                             form: {
    //                                 message: message
    //                             },
    //                         }, (err, httpResponse, body) => {
    //                             if (err) {
    //                                 console.log(err)
    //                             } else {
    //                                 // console.log(body)
    //                                 // res.json({
    //                                 //     // httpResponse: httpResponse,
    //                                 //     body: body
    //                                 // });

    //                                 // res.send(body)
    //                             }
    //                         });
    //                         /** start line  notify */
    //                     }
    //                 });
    //             }
            
    //         });
    //         /** End Loop forEach */

    //     });

    // });

    // setTimeout( () => {
    //     pool.get_connection(qb => {
    //         qb.select('*')
    //         .get('lp_host', (err, response) => {
    //             // qb.release();

    //             if (err) return console.error("Uh oh! Couldn't get results: " + err.msg);

    //             res.json({
    //                 status : 200,
    //                 dataList: response
    //             })

    //         });
    //     });
    // }, 2000);

    /** === การเรียกใช้ฟังก์ชัน === */
    await getHostListById(projectId).then((resHostListById) => {
        if(resHostListById)
        {
            // console.log('Host List By Id : ' + resHostListById);
            res.json({
                status : 200,
                dataList: resHostListById
            })
        }
    });
    
});

/** === Project new === */
app.get('/projectList', (req, res) => {
    db.query('select * from lp_project', (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.send(rows);
        }
    });
});

app.get('/projectId/:id', (req, res) => {

    const id = req.params.id;

    db.query("SELECT * FROM lp_project WHERE id = ?", id, (err, row) => {
        if (err) {
            console.log(err);
        } else {
            res.send(row);
        }
    });
});

app.post('/project/add', (req, res) => {
    const name = req.body.name;
    const conJob = req.body.conJob;
    const tokenLineNotify = req.body.tokenLineNotify;
    const create_date = new Date();

    if(name !== '' && tokenLineNotify !== '') // && conJob !== ''
    {
        db.query(
            "INSERT INTO lp_project (name, con_job, token_line_notify, create_date) VALUES (?, ?, ?, ?)",
            [name, conJob, tokenLineNotify, create_date],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'บันทึกข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.put('/project/update', (req, res) => {

    const id = req.body.id;
    const name = req.body.name;
    const conJob = req.body.conJob;
    const tokenLineNotify = req.body.tokenLineNotify;
    const update_date = new Date();

    if(id !== '' && name !== ''  && tokenLineNotify !== '') // && conJob !== ''
    {
        db.query(
            "UPDATE lp_project SET name = ?, con_job = ?, token_line_notify = ?, update_date = ? WHERE id  = ?",
            [name, conJob,  tokenLineNotify, update_date, id],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'แก้ไขข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.delete('/project/delete/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        "DELETE FROM lp_project WHERE Id = ?", id, (err, result) =>
        {
            if(err)
            {
                console.log(err);
            }
            else
            {
                res.json({
                    status: 200,
                    message: 'ลบข้อมูลเรียบร้อย'
                })
            }
        });

})

app.get('/project/detail/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM lp_host WHERE project_id = ?', id, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.send(rows);
        }
    });
});

// === Host new === //

app.post('/host/add', (req, res) => {
    const projectId     = req.body.projectId;
    const machineName   = req.body.machineName;
    const dutyId        = req.body.dutyId;
    const publicIp      = (req.body.publicIp)? req.body.publicIp : null ;
    const privateIp     = req.body.privateIp;
    const service       = req.body.service;
    const remark        = req.body.remark;
    const createDate    = new Date();

    const sqlTypeId     = (req.body.sqlTypeId)? req.body.sqlTypeId : null; 
    const username      = (req.body.username)? req.body.username : null; 
    const password      = (req.body.password)? req.body.password : null; 
    const myDatabase    = (req.body.myDatabase)? req.body.myDatabase : null; 

    // console.log(req)

    // res.json({
    //     status: 200,
    //     message: projectId
    //     // message: [projectId, machineName, publicIp, privateIp]
    // })

    if(projectId !== '' && machineName !== '' && privateIp !== '') // && publicIp !== ''
    {
        db.query(
            "INSERT INTO lp_host (project_id, machine_name, duty_id, public_ip, private_ip, port, remark, sql_type_id, username, password, my_database, create_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [projectId, machineName, dutyId, publicIp, privateIp, service, remark, sqlTypeId, username, password, myDatabase, createDate],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'บันทึกข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.put('/host/update', (req, res) => {

    const id            = req.body.id;
    const projectId     = req.body.projectId;
    const machineName   = req.body.machineName;
    const dutyId        = req.body.dutyId;
    const publicIp      = (req.body.publicIp)? req.body.publicIp : null ;
    const privateIp     = req.body.privateIp;
    const service       = req.body.service;
    const remark        = req.body.remark;
    const update_date   = new Date();

    const sqlTypeId     = (req.body.sqlTypeId)? req.body.sqlTypeId : null; 
    const username      = (req.body.username)? req.body.username : null; 
    const password      = (req.body.password)? req.body.password : null; 
    const myDatabase    = (req.body.myDatabase)? req.body.myDatabase : null; 

    if(id !== '' && projectId !== '' && machineName !== '' && privateIp !== '') // && publicIp !== ''
    {
        db.query(
            "UPDATE lp_host SET project_id = ?, machine_name = ?, duty_id = ?, public_ip = ?, private_ip = ?, port = ?, remark = ?, sql_type_id = ?, username = ?, password = ?, my_database = ?, update_date = ? WHERE id  = ?",
            [projectId, machineName, dutyId, publicIp, privateIp, service, remark, sqlTypeId, username, password, myDatabase, update_date, id],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'แก้ไขข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.delete('/host/delete/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        "DELETE FROM lp_host WHERE id = ?", id, (err, result) =>
        {
            if(err)
            {
                console.log(err);
            }
            else
            {
                res.json({
                    status: 200,
                    message: 'ลบข้อมูลเรียบร้อย'
                })
            }
        });

})

// ======================== //

/** === Host old === */
app.get('/hostList', async (req, res) => {
    // db.query('select * from lp_host', (err, rows) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.send(rows);
    //     }
    // });
    let rows = '';
    await getHostList().then((a) => {
        rows = a;
    });

    console.log(rows);

    // if(rows )
    // {
    //     res.json({
    //         status: 200,
    //         dataList: rows
    //     })
    // }
    // else
    // {
    //     res.json({
    //         status: 500,
    //         message: 'ไม่พบข้อมูล'
    //     })
    // }
});

app.get('/hostId/:id', (req, res) => {

    const id = req.params.id;

    db.query("SELECT * FROM lp_host WHERE Id = ?", id, (err, row) => {
        if (err) {
            console.log(err);
        } else {
            res.send(row);
        }
    });
});

app.post('/add', (req, res) => {
    const nameProject = req.body.nameProject;
    const nameSystem = req.body.nameSystem;
    const publicIp = req.body.publicIp;
    const privateIp = req.body.privateIp;

    // console.log(req)

    // res.json({
    //     status: 200,
    //     message: nameProject
    //     // message: [nameProject, nameSystem, publicIp, privateIp]
    // })

    if(nameProject !== '' && nameSystem !== '' && publicIp !== '' && privateIp !== '')
    {
        db.query(
            "INSERT INTO lp_host (Name_project, machine_name, public_ip, private_ip) VALUES (?, ?, ?, ?)",
            [nameProject, nameSystem, publicIp, privateIp],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'บันทึกข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.put('/update', (req, res) => {

    const id = req.body.id;
    const nameProject = req.body.nameProject;
    const nameSystem = req.body.nameSystem;
    const publicIp = req.body.publicIp;
    const privateIp = req.body.privateIp;

    if(id !== '' && nameProject !== '' && nameSystem !== '' && publicIp !== '' && privateIp !== '')
    {
        db.query(
            "UPDATE lp_host SET Name_project = ?, machine_name = ?, public_ip = ?, private_ip = ? WHERE id  = ?",
            [nameProject, nameSystem, publicIp, privateIp, id],
            (error, result) => {
                if(error) {
                    console.log(error);
                }
                else {
                    res.json({
                        status: 200,
                        message: 'แก้ไขข้อมูลเรียบร้อย'
                    })
                }
            }
         );
    }
    else
    {
        res.json({
            status: 400,
            message: 'Data is null or empty!'
        })
    }
});

app.delete('/delete/:id', (req, res) => {
    const id = req.params.id;

    db.query(
        "DELETE FROM lp_host WHERE Id = ?", id, (err, result) =>
        {
            if(err)
            {
                console.log(err);
            }
            else
            {
                res.json({
                    status: 200,
                    message: 'ลบข้อมูลเรียบร้อย'
                })
            }
        });

})

/** Function */
async function getHostList() {
    
    const qb = await pool.get_connection();

    try {
        const response = await qb.select('*')
            // .where({project_id : projectId})
            .get('lp_host');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", response);

            if(response)
            {
                return response;
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.release();
    }
}

async function getHostListById(projectId) {

    const qb = await pool.get_connection();
    try {
        const response = await qb.select('*')
            .where({project_id : projectId})
            .get('lp_host');

            // console.log("Query Ran: " + qb.last_query());
            // console.log("Results:", response);

            if(response)
            {
                return response;
            }

    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.release();
    }
}

function processHost(hostDetail)
{
    /** === Web or API === */
    if( hostDetail.duty_id && (hostDetail.duty_id === 1 || hostDetail.duty_id === 2) )
    {
        if(hostDetail.public_ip)
        {
            const objHttp = {};

            objHttp.host = hostDetail.public_ip;
            if(hostDetail.port)
            {
                objHttp.port = hostDetail.port;
            }

            console.log(objHttp);
            const httpRequest =  http.get(objHttp, function(httpResponse){
                if( httpResponse.statusCode == 200 ||  httpResponse.statusCode == 302)
                {
                    /** === เรียกใช้ฟังก์ชัน === */
                    updateStatusSendLineNotify(hostDetail, httpResponse.statusCode, false)

                    // console.log(555); 
    
                    /** update status */
                    // qb.update('lp_host', {'Status': httpResponse.statusCode}, {Id: hostDetail.Id});
                }
                else
                {
                    /** === เรียกใช้ฟังก์ชัน === */
                    updateStatusSendLineNotify(hostDetail, httpResponse.statusCode, true)
    
                    // console.log(666); 

                    /** update status */
                    // qb.update('lp_host', {'Status': httpResponse.statusCode}, {Id: hostDetail.Id});
                }
            });
    
            /** === กรณี http error === */
            httpRequest.on('error', () => {
            
                /** === เรียกใช้ฟังก์ชัน === */
                updateStatusSendLineNotify(hostDetail, 500, true)

                // console.log(777); 
        
                /** update status */
                // qb.update('lp_host', {'Status': 500}, {Id: hostDetail.Id});
            });
            /** === /กรณี http error === */
        }
       
    }

    // if(hostDetail.public_ip)
    // {
    //     const host = hostDetail.public_ip 


    //     ping.promise.probe(host)
    //     .then(function (pingResponse) {
    //         // console.log(pingResponse);

    //         if(pingResponse.alive === true)
    //         {
    //             /** update status */
    //             qb.update('lp_host', {'status': 200}, {Id: hostDetail.Id});
    //         }
        
    //         if(pingResponse.alive === false)
    //         {
    //             /** update status */
    //             qb.update('lp_host', {'status': 500}, {Id: hostDetail.Id});

    //             /** start line  notify */
    //             const url_line_notification = "https://notify-api.line.me/api/notify";

    //             /** เขียน message */
    //             // ชื่อโครงการ : ' + hostDetail.Name_project + '\n 
    //             const message = 'ชื่อเครื่อง : ' + hostDetail.machine_name + '\n Public IP : ' + hostDetail.public_ip + '\n Status : ' + 500 ;

    //             request({
    //                 method: 'POST',
    //                 uri: url_line_notification,
    //                 header: {
    //                     'Content-Type': 'multipart/form-data',
    //                 },
    //                 auth: {
    //                     bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
    //                 },
    //                 form: {
    //                     message: message
    //                 },
    //             }, (err, httpResponse, body) => {
    //                 if (err) {
    //                     console.log(err)
    //                 } else {
    //                     // console.log(body)
    //                     // res.json({
    //                     //     // httpResponse: httpResponse,
    //                     //     body: body
    //                     // });

    //                     // res.send(body)
    //                 }
    //             });
    //             /** start line  notify */
    //         }
    //     });


    // }
}

async function updateStatusSendLineNotify(hostDetail, status, lineNotify = false){

    const qb = await pool.get_connection();

    /** update status */
    await qb.update('lp_host', {'status': status}, {id: hostDetail.id});
    

    if( lineNotify === true)
    {

        try {
            const response = await qb.select('*')
                .where({id : hostDetail.project_id})
                .get('lp_project');
    
                // console.log("Query Ran: " + qb.last_query());
                // console.log("Results:", response);
    
                if(response)
                {
                    /** start line  notify */
                    const url_line_notification = "https://notify-api.line.me/api/notify";

                    /** เขียน message */
                    const message = 'ชื่อโครงการ : ' + response[0].name + 
                        '\n ชื่อระบบงาน : ' + hostDetail.machine_name + 
                        '\n Public IP : ' + hostDetail.public_ip + 
                        '\n Status : ' + status ;

                    request({
                        method: 'POST',
                        uri: url_line_notification,
                        header: {
                            'Content-Type': 'multipart/form-data',
                        },
                        auth: {
                            bearer: response[0].token_line_notify,
                            // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                        },
                        form: {
                            message: message
                        },
                    }, (err, httpResponse, body) => {
                        if (err) {
                            console.log(err)
                        } else {
                            // console.log(body)
                            // res.json({
                            //     // httpResponse: httpResponse,
                            //     body: body
                            // });

                            // res.send(body)
                        }
                    });
                    /** start line  notify */
                  
                }
    
        } catch (err) {
            return console.error("Uh oh! Couldn't get results: " + err.msg);
        } finally {
            qb.release();
        }
    }
}


app.listen('3001', (req, res) => {
    console.log('Server running on localhost:3001');
});

