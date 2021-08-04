var curriculumData = [];
var curriculumDataMap = new Map()

function process_json(str) {
    let json = JSON.parse(str);
    let data;
    if ("data" in json) {
        data = json["data"]["rows"];
    } else {
        data = json;
    }
    console.log(data);
    for (let p of data) {
        if (curriculumDataMap.has(p["KCH"])) continue;
        let x = createCourseData(p);
        curriculumData.push(x);
        curriculumDataMap[x.cid] = x;
        //console.log(curriculumData[curriculumData.length-1]);
    }
    $("#txtInput").val("");
    console.log(curriculumData);
    initCourseList();
}

function importData(str) {
    curriculumData.length = 0;
    curriculumDataMap.clear();
    let json = JSON.parse(str);
    for (let x of json) {
        x.at = function (y) { return this.tcList.find(t => t.no == y); };
        curriculumData.push(x);
        curriculumDataMap[x.cid] = x;
    }
    console.log(curriculumData);
    initCourseList();
}

function exportData() {
    return JSON.stringify(curriculumData);
}

//从json数据提出有效课程数据
function createCourseData(json) {
    let courseData = {
        cid: String(json["KCH"]),
        cname: String(json["KCM"]),
        cunit: String(json["KKDW"]),
        ctype: String(json["KCXZ"]),
        credit: Number(json["XF"]),
        hours: Number(json["hours"]),
        tcList: json["tcList"].map(t => Object({
            no: String(t["KXH"]),
            teacher: String(t["SKJS"]),
            teachingPlace: String(t["teachingPlace"]),
        })),
        at: function (x) { return this.tcList.find(t => t.no == x); }
    };

    return courseData;
}

function saveContent(content, fileName) {
    let downLink = document.createElement('a');
    downLink.download = fileName;
    //字符内容转换为blod地址
    let blob = new Blob([content]);
    downLink.href = URL.createObjectURL(blob);
    // 链接插入到页面
    document.body.appendChild(downLink);
    downLink.click();
    // 移除下载链接
    document.body.removeChild(downLink);
}