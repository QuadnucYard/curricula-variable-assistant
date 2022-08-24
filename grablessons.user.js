// ==UserScript==
// @name 获取课程
// @namespace Violentmonkey Scripts
// @description  获取课程
// @run-at document-body
// @require https://ajax.aspnetcdn.com/ajax/jquery/jquery-3.5.1.min.js
// @require https://cdn.bootcdn.net/ajax/libs/clipboard.js/2.0.11/clipboard.min.js
// @match http://newxk.urp.seu.edu.cn/xsxk/*
// @grant none
// ==/UserScript==

(function () {
  'use strict';

  const createButton = (label) =>
    $(`<button type="button">${label}</button>`)
      .addClass("el-button el-button--primary el-button--small");

  const createInput = (placeholder) =>
    $(`<input type="text"/>`, {
      autocomplete: "off",
    })
      .attr("placeholder", placeholder)
      .addClass("el-input__inner");

  const root = $("<div/>")
    .attr("id", "cah-grabber")
    .css({
      "line-height": "2.5em",
      "background-color": "#337ecc",
      "margin": "auto",
      "padding": "1em",
      "width": "40em",
      "border-radius": "1em",
    })
    .css("line-height", "2.5em")
    .appendTo($("footer"));

  $("<div>课程获取助手（配合CAH使用）</div>")
    .css("font-weight", "bold")
    .css("font-size", "large")
    .appendTo(root);

  const cont1 = $("<div/>").appendTo(root);
  const cont2 = $("<div/>").appendTo(root);
  const cont3 = $("<div/>").appendTo(root);

  const txtResult = $("<textarea/>", { autocomplete: "off" })
    .attr("id", "grab-result")
    .attr("placeholder", "这里将显示结果")
    .addClass("el-textarea__inner")
    .css({
      "min-height": "100px",
      "margin": "auto",
      "font-size": "small",
    })
    .appendTo(root);

  const setResult = txt => {
    txtResult.val(txt);
    ELEMENT.Message.success("获取数据成功");
  }
  const showdata = obj => {
    setResult(JSON.stringify(obj));
  }

  $(`<div>获取各类课程数据</div>`)
    .css("display", "inline-block")
    .css("margin-right", "1em")
    .appendTo(cont1);

  createButton("系统推荐课程")
    .click(e => {
      const postdata = {
        teachingClassType: "TJKC",
        pageNumber: 1,
        pageSize: 1000,
        orderBy: "",
        campus: "1"
      };
      ELEMENT.Message.success("获取推荐课程……")
      axios.post("/elective/clazz/list", postdata).then(e => showdata(e.data));
    })
    .appendTo(cont1);

  createButton("体育项目")
    .click(e => {
      const postdata = {
        teachingClassType: "TYKC",
        pageNumber: 1,
        pageSize: 1000,
        orderBy: "",
        campus: "1"
      };
      ELEMENT.Message.success("获取体育课程……")
      axios.post("/elective/clazz/list", postdata).then(e => showdata(e.data));
    })
    .appendTo(cont1);

  createButton("通选课")
    .click(e => {
      const postdata = {
        teachingClassType: "XGKC",
        pageNumber: 1,
        pageSize: 10000,
        orderBy: "",
        campus: "1"
      };
      ELEMENT.Message.success("获取通选课……")
      axios.post("/elective/clazz/list", postdata).then(e => showdata(e.data));
    })
    .appendTo(cont1);

  const txtKeyword = createInput("关键字")
    .css({
      "width": "15em",
      "height": "2em",
      "font-size": "smaller",
      "margin-right": "1em",
    })
    .appendTo(cont2);

  createButton("获取全校课程")
    .click(e => {
      const postdata = {
        teachingClassType: "ALLKC",
        pageNumber: 1,
        pageSize: 10000,
        orderBy: "",
        KEY: txtKeyword.val()
      };
      ELEMENT.Message.success("获取全校课程……")
      axios.post("/elective/clazz/list", postdata).then(e => showdata(e.data));
    })
    .appendTo(cont2);

  const txtIndex = createInput("该课程本页序号(从0开始)")
    .css({
      "width": "15em",
      "height": "2em",
      "font-size": "smaller",
      "margin-right": "1em",
    })
    .appendTo(cont3);

  createButton("获取单一课程数据")
    .click(e => showdata(grablessonsVue.courseList[txtIndex.val()]))
    .appendTo(cont3);

  createButton("获取本页所有课程数据")
    .click(e => showdata(grablessonsVue.courseList))
    .appendTo(cont3);

  createButton("复制")
    .attr("id", "btn-copy")
    .attr("data-clipboard-target", "#grab-result")
    .appendTo(root);

  new ClipboardJS("#btn-copy")
    .on('success', e => {
      ELEMENT.Message.success("成功复制到剪贴板")
      e.clearSelection();
    });

})();
