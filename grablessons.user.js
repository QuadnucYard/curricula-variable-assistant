// ==UserScript==
// @name 获取课程
// @namespace Violentmonkey Scripts
// @description  获取课程
// @run-at document-body
// @require https://ajax.aspnetcdn.com/ajax/jquery/jquery-3.5.1.min.js
// @match http://newxk.urp.seu.edu.cn/xsxk/*
// @grant none
// ==/UserScript==

(function () {
    'use strict';

    console.log(axios);

    $("footer").append(`<div>获取课程数据</div>`);
    let btn1=$(`<button type="button" class="el-button el-button--primary">系统推荐课程</button>`).click(function(e) {
        let postdata = {
            teachingClassType: "TJKC",
            pageNumber: 1,
            pageSize: 1000,
            orderBy: "",
            campus: "1"
        };
        axios.post("/elective/clazz/list", postdata).then(function (e) {
            showdata(e.data);
        });
    });
    let btn2=$(`<button type="button" class="el-button el-button--primary">体育项目</button>`).click(function(e) {
        let postdata = {
            teachingClassType: "TYKC",
            pageNumber: 1,
            pageSize: 1000,
            orderBy: "",
            campus: "1"
        };
        axios.post("/elective/clazz/list", postdata).then(function (e) {
            showdata(e.data);
        });
    });
    let btn3=$(`<button type="button" class="el-button el-button--primary">通选课</button>`).click(function(e) {
        let postdata = {
            teachingClassType: "XGKC",
            pageNumber: 1,
            pageSize: 10000,
            orderBy: "",
            campus: "1"
        };
        axios.post("/elective/clazz/list", postdata).then(function (e) {
            showdata(e.data);
        });
    });
    $("footer").append(btn1).append(btn2).append(btn3);
    $("footer").append(`<div><textarea id="datadata"></textarea></div>`);

    function showdata(obj) {
        $("#datadata").val(JSON.stringify(obj));
        ElementPlus.ElMessage({
            message: '获取成功',
            type: 'success',
            duration: 1000
        });
    }
})();
