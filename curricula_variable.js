const compareInt = (a, b) => a < b ? -1 : (b < a ? 1 : 0);

class ClassSession {
    raw; //原始字符串分成的数组
    cid; //课程代号
    cno; //课程代号
    week; //周
    day; //周几
    tStart; //开始时间
    tEnd; //结束时间
    classroom; //教室

    constructor(week, day, tStart, tEnd, classroom) {
        this.week = week;
        this.day = day;
        this.tStart = tStart;
        this.tEnd = tEnd;
        this.classroom = classroom;
    }

    get ordinal() {
        let base = (this.week - 1) * 91 + this.day * 13;
        return [base + this.tStart, base + this.tEnd];
    }

    get span() {
        return this.tEnd - this.tStart + 1;
    }

    static mapDay(str) {
        const mapday = {
            "星期一": 0,
            "星期二": 1,
            "星期三": 2,
            "星期四": 3,
            "星期五": 4,
            "星期六": 5,
            "星期日": 6
        }
        return mapday[str];
    }

    toHtml() {
        console.log(curriculumDataMap[this.cid]);
        console.log(curriculumDataMap[this.cid].at(this.cno));
        return (
            `<div class="session-label">
            <p>${curriculumDataMap[this.cid].cname}-${this.cno}</p>
            <p>${this.raw[0]}</p>
            <p>${this.raw[3]}</p>
            <p>${curriculumDataMap[this.cid].at(this.cno).teacher}</p>
        </div>`);
    }
}

class Timetable {

    #choosen = null;

    constructor() {
        //周-日-节  第0周存储总体
        //this.#choosen = new Array(17).fill(new Array(7).fill(new Array(13).fill(null)));
        this.#choosen = Array.from({ length: 17 }, () => Array.from({ length: 7 }, () => Array.from({ length: 13 }, () => null)));
    }

    checkSessionConflict(session) {
        for (let i = session.tStart; i <= session.tEnd; i++) {
            if (this.#choosen[session.week][session.day][i])
                return true;
        }
        return false;
    }

    checkCourseConflict(course_id, class_id) {
        let subcourse = curriculumDataMap[course_id].at(class_id);
        let sessions = this.#resolveTeachingPlace(subcourse.teachingPlace);
        return sessions.some(t => this.checkSessionConflict(t));
    }

    //选课
    chooseCourse(course_id, class_id) {
        console.log("chooseCourse", course_id, class_id);
        let course = curriculumDataMap[course_id];
        let subcourse = course.at(class_id);
        console.log(course);
        console.log(course.at);
        console.log(course.tcList.find(t => t.no == class_id));
        console.log(subcourse);
        let sessions = this.#resolveTeachingPlace(subcourse.teachingPlace);
        if (sessions.some(t => this.checkSessionConflict(t))) return false;
        for (let session of sessions) {
            session.cid = course_id;
            session.cno = class_id;
            for (let i = session.tStart; i <= session.tEnd; i++) {
                this.#choosen[session.week][session.day][i] = session;
                //this.#choosen[session.week][session.day][i] = course_id + "-" + class_id;
                //console.log(this.#choosen[session.week][session.day][i]);
            }
        }
        console.log("select", course_id, class_id);
        //console.log(this.#choosen);
        return true;
    }

    //退课
    dropCourse(course_id, class_id) {
        console.log("drop", course_id, class_id);
        let course = curriculumDataMap[course_id];
        let subcourse = course.tcList.find(t => t.no == class_id);
        let sessions = this.#resolveTeachingPlace(subcourse.teachingPlace);
        for (let session of sessions) {
            for (let i = session.tStart; i <= session.tEnd; i++) {
                this.#choosen[session.week][session.day][i] = null;
            }
        }
    }

    toHtml(week) {
        return (
            `<tr>
                <th>节次/星期</th>
                <th>星期一</th>
                <th>星期二</th>
                <th>星期三</th>
                <th>星期四</th>
                <th>星期五</th>
                <th>星期六</th>
                <th>星期日</th>
            </tr>
            ${range(0, 13).map(t =>
                `<tr>
                    <td>${t + 1}</td>
                    ${range(0, 7).map(u =>
                    !this.#choosen[week][u][t] ? "<td></td>" :
                        t > 0 && this.#choosen[week][u][t] == this.#choosen[week][u][t - 1] ?
                            "" : `<td rowspan="${this.#choosen[week][u][t].span}">${this.#choosen[week][u][t].toHtml()}</td>`
                ).join("")}
                </tr>`).join("")}`);
    }

    //解析教学时间地点的字符串
    #resolveTeachingPlace(teachingPlace) {
        //console.log("resolve",teachingPlace);
        //有一个问题，周后面的内容可能会省略
        if (teachingPlace=="undefined") return [];
        let sp = teachingPlace.split(",").filter(t=>t!=undefined).map(str => str.split(" "));
        for (let i = sp.length - 1; i >= 0; i--) {
            if (sp[i].length <= 1) sp[i][1] = sp[i + 1][1];
            if (sp[i].length <= 2) sp[i][2] = sp[i + 1][2];
            if (sp[i].length <= 3) sp[i][3] = sp[i + 1][3];
        }
        return sp.map(s => {
            let weekstr;
            let step = 1;
            if (s[0].endsWith(")")) {
                weekstr = s[0].substr(0, s[0].length - 4);
                step = 2;
            } else {
                weekstr = s[0].substr(0, s[0].length - 1);
            }
            let [t1, t2] = weekstr.split("-").map(t => parseInt(t));
            let arr = [];
            for (; t1 <= t2; t1 += step) {
                let ses = new ClassSession(
                    t1,
                    ClassSession.mapDay(s[1]),
                    ...(s[2].substr(0, s[2].length - 1).split("-").map(t => parseInt(t) - 1)),
                    s[3]
                );
                ses.raw = s;
                arr.push(ses);
            }
            return arr;
        }).flat().sort((a, b) => compareInt(a.ordinal[0], b.ordinal[0]));
    }

    trace() {
        console.log(this.#choosen);
    }
}
window.timetable = new Timetable();

function initCourseList() {
    curriculumData = curriculumData.sort((a, b) => a.cid < b.cid ? -1 : 1);
    let ul = $("ul.clist");
    ul.html("");
    for (data of curriculumData) {
        let li = $(`<li id="${data.cid}"></li>`);
        let ul2 = data.tcList.map(t =>
            `<li id="${data.cid}-${t.no}" class="">
                <span class="tag-caption text-center" style="background-color: #13C2C2; width: 1em">${t.no}</span>
                <span class="tag-caption text-center" style="background-color: #3498DB; width: 3em">${t.teacher}</span>
                <span class="tag-caption" style="background-color: #F39C11">${t.teachingPlace}</span>
            </li>`).join("");
        li.append(
            `<div>
                <span style="display: inline-block; color: #2C7AD6; width: 80px">${data.cid}</span>
                <span>${data.cname}</span>
            </div>
            <ul>${ul2}</ul>`);
        ul.append(li);
    }
    $("ul.clist li div").click(function (event) { toggleCourseDisplay($(this).parent().attr("id")); });
    $("ul.clist li ul li").click(function (event) { selectCourse1(this.id); });
    initTimetable();
}

function initTimetable() {
    $("div#timetable-area table").html(timetable.toHtml(1));
}

function toggleCourseDisplay(course_id) {
    console.log("toggleCourseDisplay", course_id);
    let tar = $(`li#${course_id} ul`);
    if (tar.css("display") == "none") tar.css("display", "");
    else tar.css("display", "none");
}

function selectCourse1(course) {
    selectCourse(...course.split("-"));
}

function selectCourse(course_id, class_id) {
    console.log("selectCourse", course_id, class_id);
    let target = $(format("li#{0}-{1}", course_id, class_id));
    //console.log(target);
    var selection = $(`li[id^='${course_id}'][class*='selected']`).attr("id");
    //console.log($(`li[id^='${course_id}'][class*='selected']`));
    //console.log(selection);
    if (selection != undefined) timetable.dropCourse(...selection.split("-"));
    if (!target.hasClass("selected")) {
        if (timetable.chooseCourse(course_id, class_id)) {
            target.addClass("selected");
            target.siblings().removeClass("selected");
        } else {
            window.alert("Course conflict!");
        }
    } else { //点了自己
        target.removeClass("selected");
    }
    //更新一下冲突
    for (let course of curriculumData) {
        for (let cclass of course.tcList) {
            let target = $(`li#${course.cid}-${cclass.no}`)/*.not(`[id^='${course_id}']`)*/;
            if (timetable.checkCourseConflict(course.cid, cclass.no))
                target.addClass("conflicting");
            else
                target.removeClass("conflicting");
        }
    }
    initTimetable();
    //timetable.trace();
}