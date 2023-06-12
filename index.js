const express   = require('express');
const app       = express();

const request   = require('request');
const cors      = require('cors');

const bcrypt    = require('bcrypt');
const jwt       = require("jsonwebtoken");

const auth      = require("./middleware/auth");

const { 
    ProjectAdd, 
    ProjectUpdate, 
    ProjectDelete, 
    ProjectList, 
    ProjectDetail 
} = require("./models/project");

const { 
    HostAdd, 
    HostUpdate, 
    HostDelete, 
    HostList, 
    HostDetail, 
    HostListByProjectId, 
    HostHistoryCountUpDown 
} = require("./models/host");

const { 
    HostHistoryAdd 
} = require("./models/hostHistory");

const { 
    DutyAdd, 
    DutyUpdate, 
    DutyDelete, 
    DutyList, 
    DutyDetail 
} = require("./models/duty");

const Moment        = require('moment');

const http          = require('http');
const ping          = require('ping');
const urlStatusCode = require('url-status-code')

const mysql         = require('mysql');
const { pool }      = require('./config/db');

const excelJS       = require("exceljs");
const { saveAs }    = require("file-saver");

require("dotenv").config();

let projectIdOld = '';
let projectIdNew = '';
let dataObj      = {};
let numtest = 0;

app.use(cors());
app.use(express.json());

// app.use(express.urlencoded({ extended: true }));
// app.use(express.static('public'));

// app.set('view engine', 'ejs');
// app.set('views', 'views');
// app.set('view options', { layout: false });

app.post("/register", async (req, res) => {
    // Our register logic starts here
    try {
      // Get user input
      const { first_name, last_name, email, username, password } = req.body;
  
      // Validate user input
    //   if (!(email && username && password && first_name && last_name)) {
    //     res.status(400).send("All input is required");
    //   }
  
      // check if user already exist
      // Validate if user exist in our database
    //   const oldUser = await User.findOne({ email });
      const oldUser = await qb.where('username', username).get('lp_user');

      if (oldUser.length > 0) {
        return res.status(409).send("User Already Exist. Please Login");
      }

      //Encrypt user password
      encryptedPassword = await bcrypt.hash(password, 10);
  
      // Create user in our database
    //   const user = await User.create({
    //     first_name,
    //     last_name,
    //     email: email.toLowerCase(), // sanitize: convert email to lowercase
    //     password: encryptedPassword,
    //   });

      // result: {insert_id: [{id: 12345}], affected_rows: 1, changed_rows: 0}
      const result = await qb.returning('*').insert('lp_user', {
        username: username, 
        password: encryptedPassword,
        first_name: first_name,
        last_name: last_name,
        email: email.toLowerCase(),
        // create_date: new Date()
      });

    //   console.log(result.insert_id);
    //   return

      const resUser = await qb.where('id', result.insert_id).get('lp_user');
      const user    = resUser[0];
  
      // Create token
      const token = jwt.sign(
        { user_id: user.id, username },
        process.env.TOKEN_KEY,
        // 'waeyusree',
        {
          expiresIn: "2h",
        }
      );
      // save user token
      user.token = token;
  
      // return new user
      res.status(201).json(user);
    } catch (err) {
      console.log(err);
    }
    // Our register logic ends here
});

app.post("/login", async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */
    // console.log(qb);

    // Our login logic starts here
    try {
      // Get user input
      const { username, password } = req.body;
  
      // Validate user input
      if (!(username && password)) {
        res.json({
            status : 400,
            message : "All input is required"
        });
      }

    const resUser = await qb.where('username', username).get('lp_user');
    const user    = resUser[0];
  
      if (user && (await bcrypt.compare(password, user.password))) {
        // Create token
        const token = jwt.sign(
          { user_id: user.id, username },
          process.env.TOKEN_KEY,
        //   'waeyusree',
          {
            expiresIn: "2h",
          }
        );
  
        // save user token
        user.token = token;
  
        // user
        res.json({
            status : 200,
            first_name  : user.first_name,
            last_name   : user.last_name,
            token       : user.token,
            // user : user // all
        });
        return;
      }
      
      res.json({
            status : 400,
            message : "Username หรือ Password ไม่ถูกต้อง!"
      });
      return;

    } catch (err) {
      console.log(err);
    }
    // Our register logic ends here

    // qb.release();   /** === ปิด DB === */
});

app.get('/', async (req, res) => {
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
        user: 'admin',
        password: '1234',
        database: 'moniter',
        // port: '6033'
    });

    // console.log(dataDb);

    // check your database connection
    dataDb.connect(function(err) {

        if (err) {
            // res.json({
            //     status : 500,
            //     message: 'error: ' + err.message
            // })
            return console.error('error: ' + err.message);
        }

        // console.log('Connected to the MySQL server.');
        res.json({
            status : 200,
            message: 'Connected to the MySQL server.'
        })
    });


    /**===========================================*/

    // const dataDB = {
    //     host: 'localhost',
    //     database: 'moniter',
    //     user: 'admin',
    //     password: '1234',
    //     // port: '6033'
    // };
    
    // const dbConnect = new queryBuilder(dataDB, 'mysql', 'pool').get_connection();
    // try {
    //     res.json({
    //         status : 200,
    //         message: 'Connection Successfuly'
    //     })

    // } catch (err) {
    //     res.json({
    //         status : 500,
    //         message: err.msg
    //     })
    //     return;
    // } finally {
    //     dbConnect.release();
    // }

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

// ======================== //

app.get('/check_host_interval', async (req, res) => {
    let condition   = {};
    // let projectList = '';

    await getProjectList(condition)
    .then( async (resProjectList) => {
        if(resProjectList)
        {
            await resProjectList.forEach( async (projectDetail, key) => {
                // console.log(projectDetail)
        
                /*=== updateProject ===*/
                await updateProject(projectDetail.id, {is_process : 1});
        
                await getHostListById(projectDetail.id)
                .then( async (resHostListById) => {
        
                    let totalHost = num = 0;
                    if(resHostListById)
                    {
                        totalHost = resHostListById.length;
                        await resHostListById.forEach( async (hostDetail, key) => {
                            
                            await processHost(hostDetail);
        
                            num = key+1;
                            // console.log(totalHost + ' -> ' + num);
        
                            // console.log(typeof totalHost);
                            // console.log(typeof num);
        
                            if(totalHost === num)
                            {
                                //    console.log(1);
                                /*=== updateProject ===*/
                                await updateProject(projectDetail.id, {is_process : 0});
                            }
                        });
                    }
                });
            });
        }

        res.json({
            status : 200,
            data : resProjectList
        })

    });

    // return res.json({
    //     status : 200,
    //     data : projectList
    // })
});

app.get('/check_host/:projectId', auth, async (req, res) => {

    const qb        = await pool.get_connection(); /** === Connection DB === */
    const projectId = req.params.projectId;
 
    await HostListByProjectId(qb, projectId)
    .then( async (resHostListById) => {

        resHostListById.forEach( async (hostDetail, key) => {
            await processHost(qb, hostDetail)
            .then((resultProcessHost) => {
                // console.log("resultProcessHost : " + resultProcessHost);
                if(resultProcessHost)
                {
                    // console.log("resultProcessHost : " + (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num));

                    if(resHostListById.length === (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num))
                    {
                        /**=== reset dataObj ===*/
                        projectIdOld = '';
                        projectIdNew = '';
                        dataObj = {
                            'tokenLineNotify' : '',
                            'hostUp' : {
                                'num'       : 0,
                                'dataList'  : []
                            },
                            'hostDown': {
                                'num'       : 0,
                                'dataList'  : []
                            }
                        }

                        //  console.log(" Ok : " + resHostListById.length + " = " + (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num));

                        if(resultProcessHost.tokenLineNotify && resultProcessHost.hostDown.num > 0)
                        {
                            const aaa = [];
                            /** start line  notify */
                            const url_line_notification = "https://notify-api.line.me/api/notify";
                            const hostDownList          = resultProcessHost.hostDown.dataList;
                            // let message = '';
                            // message += 'เครื่องที่ Down ตอนนี้ ' + resultProcessHost.hostDown.num + ' เครื่อง';

                            const n = 5; //tweak this to add more items per line

                            const resultSplice = new Array(Math.ceil(hostDownList.length / n))
                            .fill()
                            .map(_ => hostDownList.splice(0, n));
                            // console.log(resultSplice);

                            let message = '';
                            let num1    = 0;

                            let message2 = '';
                            let num2     = 0;

                            const dateNow = Moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

                            resultSplice.forEach((value1, key1) => {

                                message  = '';
                                message += 'โครงการ : ' + resultProcessHost.projectName;

                                num1 = (key1+1);

                                let page = '( หน้า ' + num1 + ' )';
                                let ms_host_down = '\n\n เครื่องที่ Down ตอนนี้ ' + resultProcessHost.hostDown.num + ' เครื่อง';

                                if(num1 > 1)
                                {
                                    ms_host_down = '';
                                    page = '( ต่อหน้า ' + num1 + ' )';
                                }

                                message += ms_host_down;
                            
                                // console.log("page : " + page);
                                // console.log("hostDown num : " + resultProcessHost.hostDown.num);

                                message2 = '';
                                num2     = 0;
                                value1.forEach((value2, key2) => {

                                    // console.log("message : " + value2.message);
                                    message2 += ' \n ' + value2.message;
                                    num2 = (key2+1);
                                });

                                message += message2;
                                message += '\n\n' + dateNow + ' ' + page;

                                if(value1.length === num2)
                                {

                                    aaa.push({
                                        'page': page, 
                                        'messageLast' : message
                                    });

                                    // request({
                                    //     method: 'POST',
                                    //     uri: url_line_notification,
                                    //     header: {
                                    //         'Content-Type': 'multipart/form-data',
                                    //     },
                                    //     auth: {
                                    //         bearer: resultProcessHost.tokenLineNotify,
                                    //         // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                                    //     },
                                    //     form: {
                                    //         message: message
                                    //     },
                                    // }, (err, httpResponse, body) => {
                                    //     if (err) {
                                    //         console.log(err)
                                    //     } else {
        
                                    //         console.log('num1 : ' + resultSplice.length + ' = ' + num1)
                                    //         if(resultSplice.length === num1)
                                    //         {
                                    //             res.json({
                                    //                 status : 200, 
                                    //             })
                                    //             return;
                                    //         }
                                            
                                    //         // console.log(body)
                                    //         // res.json({
                                    //         //     // httpResponse: httpResponse,
                                    //         //     body: body
                                    //         // });
                
                                    //         // res.send(body)
                                    //     }
                                    // });
                                }
                                
                            });

                            let aaaNum = 0;
                            if(aaa.length > 0)
                            {
                                aaa.forEach((aaaValue, aaaKey) => {

                                    aaaNum = (aaaKey+1);
                                    request({
                                        method: 'POST',
                                        uri: url_line_notification,
                                        header: {
                                            'Content-Type': 'multipart/form-data',
                                        },
                                        auth: {
                                            bearer: resultProcessHost.tokenLineNotify,
                                            // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
                                        },
                                        form: {
                                            message: aaaValue.messageLast
                                        },
                                    }, (err, httpResponse, body) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
        
                                            // if(aaa.length === aaaNum)
                                            // {
                                            //     // console.log('numtest : ' + numtest);
                                            //     res.json({
                                            //         status : 200, 
                                            //     })
                                            //     return;
                                            // }
                                            
                                            // console.log(body)
                                            // res.json({
                                            //     // httpResponse: httpResponse,
                                            //     body: body
                                            // });
                
                                            // res.send(body)
                                        }
                                    });
                                })
                            }

                            if(aaa.length === aaaNum)
                            {
                                // console.log('numtest : ' + numtest);
                                res.json({
                                    status : 200, 
                                })
                                return;
                            }

                            
                            /** start line  notify */

                        }
                    }
                }
            });
        });

        

        // var i = 0;
        // while (i < resHostListById.length) {

        //     await processHost(qb, resHostListById[i])
        //     .then((resultProcessHost) => {
        //         console.log("resultProcessHost : " + resultProcessHost);
        //         if(resultProcessHost)
        //         {
        //             console.log("resultProcessHost : " + (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num));

        //             if(resHostListById.length === (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num))
        //             {
        //                 /**=== reset dataObj ===*/
        //                 projectIdOld = '';
        //                 projectIdNew = '';
        //                 dataObj      = {}
        //                 // dataObj = {
        //                 //     'tokenLineNotify' : '',
        //                 //     'hostUp' : {
        //                 //         'num'       : 0,
        //                 //         'dataList'  : []
        //                 //     },
        //                 //     'hostDown': {
        //                 //         'num'       : 0,
        //                 //         'dataList'  : []
        //                 //     }
        //                 // }

        //                  console.log(" Ok : " + resHostListById.length + " = " + (resultProcessHost.hostUp.num + resultProcessHost.hostDown.num));
        //                 // console.log("hostUp num : " + resultProcessHost.hostUp.num);
        //                 // console.log("hostUp dataList : " + resultProcessHost.hostUp.dataList);
        //                 // console.log("hostDown num : " + resultProcessHost.hostDown.num);
        //                 // console.log("hostDown dataList : " + resultProcessHost.hostDown.dataList);

        //                 if(resultProcessHost.tokenLineNotify && resultProcessHost.hostDown.num > 0)
        //                 {
        //                     const aaa = [];
        //                     /** start line  notify */
        //                     const url_line_notification = "https://notify-api.line.me/api/notify";
        //                     const hostDownList          = resultProcessHost.hostDown.dataList;
        //                     // let message = '';
        //                     // message += 'เครื่องที่ Down ตอนนี้ ' + resultProcessHost.hostDown.num + ' เครื่อง';

        //                     const n = 5; //tweak this to add more items per line

        //                     const resultSplice = new Array(Math.ceil(hostDownList.length / n))
        //                     .fill()
        //                     .map(_ => hostDownList.splice(0, n));
        //                     // console.log(resultSplice);

        //                     let message = '';
        //                     let num1    = 0;

        //                     let message2 = '';
        //                     let num2     = 0;

        //                     const dateNow = Moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

        //                     resultSplice.forEach((value1, key1) => {

        //                         message  = '';
        //                         message += 'โครงการ : ' + resultProcessHost.projectName;

        //                         num1 = (key1+1);
        //                         let page = '( หน้า ' + num1 + ' )';
        //                         if(num1 > 1)
        //                         {
        //                             page = '( ต่อหน้า ' + num1 + ' )';
        //                         }
                                
        //                         // console.log("resultSplice Length : " + resultSplice.length);
        //                         console.log("page : " + page);
        //                         // console.log("value : " + value1[key1]);

        //                         message2 = '';
        //                         num2     = 0;
        //                         value1.forEach((value2, key2) => {

        //                             // console.log("message : " + value2.message);
        //                             message2 += ' \n ' + value2.message;
        //                             num2 = (key2+1);
        //                         });

        //                         message += message2;
        //                         message += '\n\n' + dateNow + ' ' + page;

        //                         if(value1.length === num2)
        //                         {

        //                             aaa.push({
        //                                 'page': page, 
        //                                 'messageLast' : message
        //                             });

        //                             // request({
        //                             //     method: 'POST',
        //                             //     uri: url_line_notification,
        //                             //     header: {
        //                             //         'Content-Type': 'multipart/form-data',
        //                             //     },
        //                             //     auth: {
        //                             //         bearer: resultProcessHost.tokenLineNotify,
        //                             //         // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
        //                             //     },
        //                             //     form: {
        //                             //         message: message
        //                             //     },
        //                             // }, (err, httpResponse, body) => {
        //                             //     if (err) {
        //                             //         console.log(err)
        //                             //     } else {
        
        //                             //         console.log('num1 : ' + resultSplice.length + ' = ' + num1)
        //                             //         if(resultSplice.length === num1)
        //                             //         {
        //                             //             res.json({
        //                             //                 status : 200, 
        //                             //             })
        //                             //             return;
        //                             //         }
                                            
        //                             //         // console.log(body)
        //                             //         // res.json({
        //                             //         //     // httpResponse: httpResponse,
        //                             //         //     body: body
        //                             //         // });
                
        //                             //         // res.send(body)
        //                             //     }
        //                             // });
        //                         }
                                
        //                     });

        //                     let aaaNum = 0;
        //                     if(aaa.length > 0)
        //                     {
        //                         aaa.forEach((aaaValue, aaaKey) => {

        //                             aaaNum = (aaaKey+1);
        //                               request({
        //                                 method: 'POST',
        //                                 uri: url_line_notification,
        //                                 header: {
        //                                     'Content-Type': 'multipart/form-data',
        //                                 },
        //                                 auth: {
        //                                     bearer: resultProcessHost.tokenLineNotify,
        //                                     // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
        //                                 },
        //                                 form: {
        //                                     message: aaaValue.messageLast
        //                                 },
        //                             }, (err, httpResponse, body) => {
        //                                 if (err) {
        //                                     console.log(err)
        //                                 } else {
        
        //                                     if(aaa.length === aaaNum)
        //                                     {
        //                                         res.json({
        //                                             status : 200, 
        //                                         })
        //                                         return;
        //                                     }
                                            
        //                                     // console.log(body)
        //                                     // res.json({
        //                                     //     // httpResponse: httpResponse,
        //                                     //     body: body
        //                                     // });
                
        //                                     // res.send(body)
        //                                 }
        //                             });
        //                         })
        //                     }

        //                     // hostDownList.forEach((value, key)=> {
        //                     //     // console.log( "hostDownList length" + hostDownList.length + " = " + (key+1))
        //                     //     // console.log( "hostDownList message" + value.message)

        //                     //     message += ' \n ' + value.message;

        //                     //     if(hostDownList.length === (key+1) )
        //                     //     {
        //                     //              console.log( message.length)

        //                     //         request({
        //                     //             method: 'POST',
        //                     //             uri: url_line_notification,
        //                     //             header: {
        //                     //                 'Content-Type': 'multipart/form-data',
        //                     //             },
        //                     //             auth: {
        //                     //                 bearer: resultProcessHost.tokenLineNotify,
        //                     //                 // bearer: 'Fr48xE3Sld2ibeFboVF083GNPm38FUT0vZgnCk5Vvi2',
        //                     //             },
        //                     //             form: {
        //                     //                 message: message
        //                     //             },
        //                     //         }, (err, httpResponse, body) => {
        //                     //             if (err) {
        //                     //                 console.log(err)
        //                     //             } else {
        
        //                     //                 res.json({
        //                     //                     status : 200, 
        //                     //                 })
        //                     //                 return;
                                            
        //                     //                 // console.log(body)
        //                     //                 // res.json({
        //                     //                 //     // httpResponse: httpResponse,
        //                     //                 //     body: body
        //                     //                 // });
                
        //                     //                 // res.send(body)
        //                     //             }
        //                     //         });
        //                     //     }
        //                     // });
        //                     /** start line  notify */

        //                 }
        //             }

        //             i++;
        //         }

        //     });
        // }
          

    }) 
});

app.get('/export_host/:projectId', auth, async (req, res) => {

    const qb        = await pool.get_connection(); /** === Connection DB === */
    const projectId = req.params.projectId;

    await HostListByProjectId(qb, projectId)
    .then( async (resHostListById) => {

        let resultDutyList              = await DutyList(qb);
        let resultDutyListObjIdToName   = resultDutyList.reduce((a, v) => ({ ...a, [v.id]: v.duty_name}), {}) ;

        const workbook = new excelJS.Workbook();  // Create a new workbook
        const worksheet = workbook.addWorksheet("My Users"); // New Worksheet
        const path = __dirname + "/files";  // Path to download excel
        // Column for data in excel. key must match data key

        // worksheet.getCell(`A1`).value = "ชื่อโครงการ : ระบบ Local Government (Test )"; // Assign title to cell A1 -- THIS IS WHAT YOU'RE LOOKING FOR.
        // worksheet.mergeCells('A1:I1'); // Extend cell over all column headers
        // worksheet.getCell(`A1`).alignment = { horizontal: 'center' }; // Horizontally center your text

        worksheet.columns = [
            { header: "ลำดับ", key: "no", width: 10 }, 
            { header: "ชื่อเครื่อง", key: "machine_name", width: 50 },
            { header: "หน้าที่", key: "duty_title", width: 10 },
            { header: "Public IP", key: "public_ip", width: 30 },
            { header: "Private IP", key: "private_ip", width: 30 },
            { header: "Port", key: "port", width: 10 },
            { header: "สถานะ", key: "status_title", width: 10 },
            { header: "หมายเหตุ", key: "remark", width: 30 },
            { header: "วันที่อัพเดทล่าสุด", key: "update_date", width: 20 },
        ];

        resHostListById.forEach( async (hostDetail, key) => {
            hostDetail.no = key+1;

            /** === start duty === */
            hostDetail.duty_title = '';
            if(hostDetail.duty_id)
            {
                hostDetail.duty_title = resultDutyListObjIdToName[hostDetail.duty_id];
            }
            /** === end duty === */

            /** === start ip_type === */
            if(hostDetail.ip_type_id === 1 && hostDetail.public_ip)
            {
                hostDetail.public_ip = hostDetail.public_ip + " (ใช้ในการตรวจสอบ)";
            }

            if(hostDetail.ip_type_id === 2 && hostDetail.private_ip)
            {
                hostDetail.private_ip = hostDetail.private_ip + " (ใช้ในการตรวจสอบ)";
            }
            /** === end ip_type === */

            /** === start status === */
            hostDetail.status_title = '';
            if(hostDetail.is_status === '0')
            {
                hostDetail.status_title = "Down(" + hostDetail.status + ")";
            }
            if(hostDetail.is_status === '1')
            {
                hostDetail.status_title = "Up(" + hostDetail.status + ")";
            }
            /** === end status === */

            worksheet.addRow(hostDetail); // Add data in worksheet

        });

        // Making first line in excel bold
        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold: true };
        });

        try {
            // workbook.xlsx.writeFile(`${path}/users.xlsx`)
            // .then(() => {
            //     res.json({
            //         status: 200,
            //         // message: "file successfully downloaded",
            //         path: `${path}/users.xlsx`,
            //     });
            // });

            // res is a Stream object
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=" + "tutorials.xlsx"
            );
            
            return workbook.xlsx.write(res).then(function () {
                res.status(200).end();
            });

        } catch (err) {
            res.json({
                status: 400,
                message: "Something went wrong",
            });
        }
    });
});

/** === Duty new === */

app.get('/dutyList', auth, async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */

    const resultDutyList = await DutyList(qb);
    // console.log(resultDutyList)
    if(resultDutyList){
        res.send(resultDutyList);
    }

    qb.release();   /** === ปิด DB === */
});

/** === Project new === */

app.get('/projectList', auth, async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */

    const resultProjectList = await ProjectList(qb);
    // console.log(resultProjectList)
    if(resultProjectList){
        res.send(resultProjectList);
    }

    qb.release();   /** === ปิด DB === */

});

app.post('/project/add', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */

    const name = req.body.name;
    const conJob = (req.body.conJob)? req.body.conJob : 0; 
    const tokenLineNotify = req.body.tokenLineNotify;

    if(name  && tokenLineNotify ) // && conJob 
    {
         const data = {
            name : name,
            con_job : conJob,
            token_line_notify : tokenLineNotify,
        }

        const resultProjectAdd = await ProjectAdd(qb, data);
        if(resultProjectAdd)
        {
            res.json({
                status: 200,
                message: 'บันทึกข้อมูลเรียบร้อย'
            })
        }
        else
        {
            res.json({
                status: 400,
                message: 'บันทึกข้อมูลไม่สำเร็จ!'
            })
        }
    }
    else
    {
        res.json({
            status: 400,
            message: 'กรุณากรอกข้อมูลช่องที่บังคับ!'
        })
    }

    qb.release(); /** === ปิด DB === */
});

app.get('/projectId/:id', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */
    const id = req.params.id;

    const resultProjectDetail = await ProjectDetail(qb, id);
    if(resultProjectDetail){
        res.send(resultProjectDetail);
    }

    qb.release(); /** === ปิด DB === */
});

app.put('/project/update', async (req, res) => {

    const qb     = await pool.get_connection(); /** === Connection DB === */
    const id     = req.body.id;
    const name   = req.body.name;
    const conJob = req.body.conJob;
    const tokenLineNotify = req.body.tokenLineNotify;

    if(id && name  && tokenLineNotify) // && conJob
    {
         const data = {
            name : name,
            con_job : conJob,
            token_line_notify : tokenLineNotify,
        }

        const resultProjectUpdate = await ProjectUpdate(qb, id, data);
        if(resultProjectUpdate)
        {
            res.json({
                status: 200,
                message: 'แก้ไขข้อมูลเรียบร้อย'
            })
        }
        else
        {
            res.json({
                status: 400,
                message: 'แก้ไขข้อมูลไม่สำเร็จ!'
            })
        }
    }
    else
    {
        res.json({
            status: 400,
            message: 'กรุณากรอกข้อมูลช่องที่บังคับ!'
        })
    }

    qb.release();   /** === ปิด DB === */
});

app.delete('/project/delete/:id', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */
    const id = req.params.id;

    const resultProjectDelete = await ProjectDelete(qb, id);
    if(resultProjectDelete)
    {
        res.json({
            status: 200,
            message: 'ลบข้อมูลเรียบร้อย'
        })
    }
    else
    {
        res.json({
            status: 400,
            message: 'ลบข้อมูลไม่สำเร็จ!'
        })
    }

    qb.release();   /** === ปิด DB === */
})

app.get('/project/detail/:id', auth, async (req, res) => {
  
    const qb       = await pool.get_connection(); /** === Connection DB === */
    const dataObj  = {}
    const id       = req.params.id;

    const resultProjectDetail = await ProjectDetail(qb, id);
    if(resultProjectDetail){

        dataObj['projectDetail'] = resultProjectDetail;
    }

    const resultProjectList = await ProjectList(qb);
    if(resultProjectList){

        dataObj['projectList'] = resultProjectList;
    }

    const resultDutyList = await DutyList(qb);
    if(resultDutyList){

        dataObj['dutyList'] = resultDutyList;
    }

    const resultHostListByProjectId = await HostListByProjectId(qb, id);
    if(resultHostListByProjectId){

        dataObj['hostListByProjectId'] = resultHostListByProjectId;
    }

    if(dataObj)
    {
        res.status(200).send(dataObj);
        qb.release(); /** === ปิด DB === */
        return;
    }

    res.status(500).send('Internal Server Error');
    qb.release(); /** === ปิด DB === */
    return;
});

// === Host new === //

app.post('/host/add', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */

    const projectId     = req.body.projectId;
    const machineName   = req.body.machineName;
    const dutyId        = req.body.dutyId;
    const ipTypeId      = req.body.ipTypeId;
    const publicIp      = (req.body.publicIp)? req.body.publicIp : null ;
    const privateIp     = (req.body.privateIp)? req.body.privateIp : null ;
    const service       = req.body.service;
    const remark        = req.body.remark;

    const sqlTypeId     = (req.body.sqlTypeId)? req.body.sqlTypeId : null; 
    const username      = (req.body.username)? req.body.username : null; 
    const password      = (req.body.password)? req.body.password : null; 
    const myDatabase    = (req.body.myDatabase)? req.body.myDatabase : null; 

    if(projectId && machineName && dutyId ) // && privateIp && publicIp
    {
        const data = {
            project_id : projectId,
            machine_name : machineName,
            duty_id : dutyId,
            ip_type_id : ipTypeId,
            public_ip : publicIp,
            private_ip : privateIp,
            port : service,
            remark : remark,

            sql_type_id : sqlTypeId,
            username : username,
            password : password,
            my_database : myDatabase,
        }

        const resultHostAdd = await HostAdd(qb, data);
        if(resultHostAdd)
        {
            res.json({
                status: 200,
                message: 'บันทึกข้อมูลเรียบร้อย'
            })
        }
        else
        {
            res.json({
                status: 400,
                message: 'บันทึกข้อมูลไม่สำเร็จ!'
            })
        }
    }
    else
    {
        res.json({
            status: 400,
            message: 'กรุณากรอกข้อมูลช่องที่บังคับ!'
        })
    }


    qb.release(); /** === ปิด DB === */
});

app.get('/hostId/:id', async (req, res) => {

    const qb       = await pool.get_connection(); /** === Connection DB === */
    const dataObj  = {}
    const id       = req.params.id;

    const resultDutyList = await DutyList(qb);
    if(resultDutyList){

        dataObj['dutyList'] = resultDutyList;
    }

    const resultHostDetail = await HostDetail(qb, id);
    if(resultHostDetail){
        // res.send(resultHostDetail);
        dataObj['hostDetail'] = resultHostDetail;
    }

    if(dataObj)
    {
        res.status(200).send(dataObj);
        qb.release(); /** === ปิด DB === */
        return;
    }

    res.status(500).send('Internal Server Error');
    qb.release(); /** === ปิด DB === */
    return;
});

app.put('/host/update', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */

    const id            = req.body.id;
    const projectId     = req.body.projectId;
    const machineName   = req.body.machineName;
    const dutyId        = req.body.dutyId;
    const ipTypeId      = req.body.ipTypeId;
    const publicIp      = (req.body.publicIp)? req.body.publicIp : null ;
    const privateIp     = (req.body.privateIp)? req.body.privateIp : null ;
    const service       = req.body.service;
    const remark        = req.body.remark;

    const sqlTypeId     = (req.body.sqlTypeId)? req.body.sqlTypeId : null; 
    const username      = (req.body.username)? req.body.username : null; 
    const password      = (req.body.password)? req.body.password : null; 
    const myDatabase    = (req.body.myDatabase)? req.body.myDatabase : null; 


    if(id && projectId && machineName ) // && privateIp && publicIp
    {
        const data = {
            project_id : projectId,
            machine_name : machineName,
            duty_id : dutyId,
            ip_type_id : ipTypeId,
            public_ip : publicIp,
            private_ip : privateIp,
            port : service,
            remark : remark,

            sql_type_id : sqlTypeId,
            username : username,
            password : password,
            my_database : myDatabase,
        }

        const resultHostUpdate = await HostUpdate(qb, id, data);
        if(resultHostUpdate)
        {
            res.json({
                status: 200,
                message: 'แก้ไขข้อมูลเรียบร้อย'
            })
        }
        else
        {
            res.json({
                status: 400,
                message: 'แก้ไขข้อมูลไม่สำเร็จ!'
            })
        }
    }
    else
    {
        res.json({
            status: 400,
            message: 'กรุณากรอกข้อมูลช่องที่บังคับ!'
        })
    }

    qb.release(); /** === ปิด DB === */
});

app.delete('/host/delete/:id', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */
    const id = req.params.id;

    const resultHostDelete = await HostDelete(qb, id);

    if(resultHostDelete)
    {
        res.json({
            status: 200,
            message: 'ลบข้อมูลเรียบร้อย'
        })
    }
    else
    {
        res.json({
            status: 400,
            message: 'ลบข้อมูลไม่สำเร็จ!'
        })
    }

    qb.release(); /** === ปิด DB === */
})

app.get('/host/history/:id', async (req, res) => {

    const qb = await pool.get_connection(); /** === Connection DB === */
    const dataObj  = {}
    const id = req.params.id;

    const resultHostDetail = await HostDetail(qb, id);
    if(resultHostDetail){
        dataObj['hostDetail'] = resultHostDetail;
    }

    const resultHostHistoryCountUpDown = await HostHistoryCountUpDown(qb, id);

    if(resultHostHistoryCountUpDown){

        const modifyData = [];

        resultHostHistoryCountUpDown.forEach((value, key) => {
            if(value.is_status === '1')
            {
                modifyData.push({
                    'name' : 'Up',
                    'y'    : value.count_status
                })
            }
            if(value.is_status === '0')
            {
                modifyData.push({
                    'name' : 'Down',
                    'y'    : value.count_status
                })
            }
        });

        dataObj['hostHistoryCountUpDownList'] = modifyData;
    }

    if(dataObj)
    {
        res.status(200).send(dataObj);
        qb.release(); /** === ปิด DB === */
        return;
    }

    res.status(500).send('Internal Server Error');
    qb.release(); /** === ปิด DB === */
    return;
})

// ======================== //

/** Function */

async function getHostListById(projectId) {

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

async function processHost(qb, hostDetail)
{
    return new Promise( async (resolve, reject) => {

        numtest = numtest + 1;

        let use_ip  = "";
        let resultUpdateStatusSendLineNotify = "";
   
        let resultDutyList              = await DutyList(qb);
        let resultDutyListObjNameToId   = resultDutyList.reduce((a, v) => ({ ...a, [v.duty_name]: v.id}), {}) ;
    
        /* === clear 'is_status': null, 'status': null === */
        // const qb = await pool.get_connection();
        // await qb.update('lp_host', {'is_status': null, 'status': null}, {id: hostDetail.id});
    
        /* === เลือก public_ip === */
        if(hostDetail.ip_type_id === 1 && hostDetail.public_ip)
        {
            use_ip = hostDetail.public_ip;
        }
    
        /* === เลือก private_ip === */
        if(hostDetail.ip_type_id === 2 && hostDetail.private_ip)
        {
            use_ip = hostDetail.private_ip;
        }
    
        /* === check null use_ip === */
        if(use_ip)
        {
            /** === Web or API === */
            if( hostDetail.duty_id && (
                hostDetail.duty_id === resultDutyListObjNameToId['Web(http)'] || 
                hostDetail.duty_id === resultDutyListObjNameToId['Web(https)']||
                hostDetail.duty_id === resultDutyListObjNameToId['API(http)'] ||
                hostDetail.duty_id === resultDutyListObjNameToId['API(https)']
            ))
            {
                const objHttp = {};
    
                objHttp.host = use_ip;
                if(hostDetail.port)
                {
                    objHttp.port = hostDetail.port;
                }

                const httpRequest =  await http.get(objHttp, async function(httpResponse){
                    // console.log('httpResponse : ' + httpResponse)

                    if( httpResponse.statusCode == 200 ||  httpResponse.statusCode == 302)
                    {
                        /** === เรียกใช้ฟังก์ชัน === */
                        resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, httpResponse.statusCode, false);
                        resolve(resultUpdateStatusSendLineNotify);
                        return;
                    }
                    else
                    {
                        /** === เรียกใช้ฟังก์ชัน === */
                        resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, httpResponse.statusCode, true);
                        resolve(resultUpdateStatusSendLineNotify);
                        return;
                    }
                });
    
                /** === กรณี http error === */
                httpRequest.on('error', async err => {

                    // console.log('err : ' +  err.message)
                    /** === เรียกใช้ฟังก์ชัน === */
                    resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, 500, true, err.message);
                    resolve(resultUpdateStatusSendLineNotify);
                    return;
                });
                /** === /กรณี http error === */
                
            }
    
            /** === Database === */
            if( hostDetail.duty_id && (
                hostDetail.duty_id === resultDutyListObjNameToId['DB(MySql)'] || 
                hostDetail.duty_id === resultDutyListObjNameToId['DB(SQLServer)']
            ))
            {
                if(hostDetail.username && hostDetail.password && hostDetail.my_database)
                {
                    // setup your databse (username & password & databasename)
                    var dataDb = await mysql.createConnection({
                        host: use_ip,
                        user: hostDetail.username,
                        password: hostDetail.password,
                        database: hostDetail.my_database,
                        port: hostDetail.port ? hostDetail.port : '3306'
                    });
    
                    // console.log(dataDb);
    
                    // check your database connection
                    dataDb.connect(async function(err) {
    
                        if (err) {

                            /** === เรียกใช้ฟังก์ชัน === */
                            // console.error('db error: ' + err.message);
                            resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, 500, true, err.message);
                            resolve(resultUpdateStatusSendLineNotify);
                            return;
    
                            // res.send(err)
                            // return console.error('error: ' + err.message);
                        }
    
                        /** === เรียกใช้ฟังก์ชัน === */
                        resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, 200, false);
                        resolve(resultUpdateStatusSendLineNotify);
                        return;
                    });
    
                } 
                else
                {
                    /** === ค่าว่าง === */
                    /** === เรียกใช้ฟังก์ชัน === */
                    resultUpdateStatusSendLineNotify = await updateStatusSendLineNotify(qb, hostDetail, 500, true, "Username or password or database is empty");
                    resolve(resultUpdateStatusSendLineNotify);
                    return;
                }
            }

        }

    });
}

async function updateStatusSendLineNotify(qb, hostDetail, status, lineNotify = false, messageError = null){
   
    // numtest = numtest + 1;

    projectIdNew = hostDetail.project_id;

    if(projectIdOld !== projectIdNew)
    {
        projectIdOld = projectIdNew;

        /**=== reset dataObj ===*/
        dataObj = {
            'tokenLineNotify' : '',
            'hostUp' : {
                'num'       : 0,
                'dataList'  : []
            },
            'hostDown': {
                'num'       : 0,
                'dataList'  : []
            }
        }
    }

    /** update status */
    // console.log(typeof status)
    let is_status = 0;
    if(status === 200 || status === 302)
    {
        is_status = 1;
    }
    // console.log('host id : ' + hostDetail.id)
    // console.log('is_status : ' + is_status)
    // console.log('status : ' + status)

    // const resultUpdate =  await qb.update('lp_host', {'is_status': is_status, 'status': status}, {id: hostDetail.id});
    const resultUpdate =  await HostUpdate(qb, hostDetail.id, {'is_status': is_status, 'status': status, 'message_error': messageError});

    // console.log(resultUpdate)

    /**=== add host history ===*/
    if(resultUpdate)
    {
        const resultHostDetail = await HostDetail(qb, hostDetail.id);
        if(resultHostDetail){
            const resultHostHistoryAdd =  await HostHistoryAdd(qb, resultHostDetail);

            if(resultHostHistoryAdd)
            {
                let   message = '';
                const resultProjectDetail = await ProjectDetail(qb, hostDetail.project_id)

                if(resultProjectDetail)
                {
                    let resultDutyList              = await DutyList(qb);
                    let resultDutyListObjIdToName   = resultDutyList.reduce((a, v) => ({ ...a, [v.id]: v.duty_name}), {}) ;

                    //  console.log(resultProjectDetail);
                    
                        /** start line  notify */
                        var title_duty = '';
                        if(hostDetail.duty_id)
                        {
                            title_duty = resultDutyListObjIdToName[hostDetail.duty_id];
                        }
    
                        var title_ip_type = '';
                        var title_public_ip_use  = hostDetail.public_ip ? hostDetail.public_ip : '';
                        var title_private_ip_use  = hostDetail.private_ip;
                        if(hostDetail.ip_type_id === 1)
                        {
                            title_ip_type = "Public IP";
                            title_public_ip_use = '`' + hostDetail.public_ip + '`';
                        }
                        else if(hostDetail.ip_type_id === 2)
                        {
                            title_ip_type = "Private IP";
                            title_private_ip_use = '`' + hostDetail.private_ip + '`';
                        }
    
                        /** เขียน message */
                        // message = 
                        // // '\n *ชื่อโครงการ :* ' + resultProjectDetail.name + 
                        // '\n *ชื่อเครื่อง :* ' + hostDetail.machine_name + 
                        // '\n *หน้าที่ :* ' + title_duty + 
                        // // '\n *ตรวจสอบโดยใช้ :* ' + title_ip_type + 
                        // '\n *Public IP :* ' + title_public_ip_use + 
                        // '\n *Private IP :* ' + title_private_ip_use +
                        // '\n *สถานะ :* `Down(' + status + ')`';

                        message = 
                        // '\n ชื่อโครงการ : ' + resultProjectDetail.name + 
                        '\n ชื่อเครื่อง : ' + hostDetail.machine_name + 
                        '\n หน้าที่ : ' + title_duty + 
                        // '\n ตรวจสอบโดยใช้ : ' + title_ip_type + 
                        '\n Public IP : ' + title_public_ip_use + 
                        '\n Private IP : ' + title_private_ip_use +
                        '\n สถานะ : Down(' + status + ')';

                        dataObj.projectName = resultProjectDetail.name;
                        if(resultProjectDetail.token_line_notify)
                        {
                            dataObj.tokenLineNotify = resultProjectDetail.token_line_notify;
                        }
                    /** start line  notify */
                }

                if( lineNotify === true)
                {
                    dataObj.hostDown.num += 1;
                    dataObj.hostDown.dataList.push( {
                        'hostId' : hostDetail.id,
                        'message' : message
                    });
                }
                else
                {
                    dataObj.hostUp.num += 1;
                    dataObj.hostUp.dataList.push( {
                        'hostId' : hostDetail.id,
                        'message' : message
                    });
                }
            }
        }
    }

    return dataObj;
}
/* ============== */

async function checkHostInterval() {
    let condition   = {};

    await getProjectList(condition)
    .then( async (resProjectList) => {
        if(resProjectList)
        {
            await resProjectList.forEach( async (projectDetail, key) => {
                // console.log(projectDetail)
        
                /*=== updateProject ===*/
                await updateProject(projectDetail.id, {is_process : 1});
        
                await getHostListById(projectDetail.id)
                .then( async (resHostListById) => {
        
                    let totalHost = num = 0;
                    if(resHostListById)
                    {
                        totalHost = resHostListById.length;
                        await resHostListById.forEach( async (hostDetail, key) => {
                            
                            await processHost(hostDetail);
        
                            num = key+1;
                            // console.log(totalHost + ' -> ' + num);
        
                            // console.log(typeof totalHost);
                            // console.log(typeof num);
        
                            if(totalHost === num)
                            {
                                //    console.log(1);
                                /*=== updateProject ===*/
                                await updateProject(projectDetail.id, {is_process : 0});
                            }
                        });
                    }
                });
            });
        }

        // res.json({
        //     status : 200,
        //     data : resProjectList
        // })

    });

    
}

async function getProjectList(condition) {

    const qb = await pool.get_connection();
    try {
        const conditionWhere = Object.assign({
            is_process : 0
        }, condition);

        const response = await qb.select('*')
            // .where({project_id : projectId})
            .where(conditionWhere)
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
}

async function updateProject(id, setValue){

    const qb = await pool.get_connection();

    // await qb.update('lp_project', {'status': status}, {id: hostDetail.id});

    try {
        const update = await qb.update('lp_project', setValue, {id: id});
        return update;
    } catch (err) {
        return console.error("Uh oh! Couldn't get results: " + err.msg);
    } finally {
        qb.release();
    }
}

// var minutes = 5, the_interval = minutes * 60 * 1000;
// setInterval(function() {
//     checkHostInterval();
//     console.log("Test interval 5 minutes");
// }, the_interval);

app.listen('3001', (req, res) => {
    console.log('Server running on localhost:3001');
});

