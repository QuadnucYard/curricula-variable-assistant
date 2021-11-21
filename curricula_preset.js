
const CourseCategory = Object.freeze({
    TJKC: "TJKC",
    TYKC: "TYKC",
    XGKC: "XGKC"
});

//一个更好的做法是开一个统一的列表，但不好操作？
class CurriculaPresetData {
    name;
    TJKC;
    TYKC;
    XGKC;

    constructor(name, rest = null) {
        this.name = name;
        this.TJKC = rest?.TJKC ? CurriculaPresetData.parseTJKC(rest.TJKC) : [];
        this.TYKC = rest?.TYKC ? CurriculaPresetData.parseTYKC(rest.TYKC) : [];
        this.XGKC = rest?.XGKC ? CurriculaPresetData.parseXGKC(rest.XGKC) : [];
    }

    static #parseRawJson(jsonstr) {
        //这里需要解决一个问题，如果输入是多个json连接起来的，需要分别解析
        let json;
        try {
            json = jsonstr.split(/(?<=})\s*(?={)/).flatMap(t => JSON.parse(t)["data"]["rows"]);
        } catch (error) {
            console.error("Parse raw json error");
            return [];
        }
        //console.log(json);
        return json;
    }

    //从原始数据包里生成
    static parseTJKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTJKC(t));
    }

    static parseTYKC(json) {
        return this.#parseRawJson(json).map(t => CourseData.parseTYKC(t));
    }

    static parseXGKC(json) {
        //这里需要注意，应该合并同id的课程
        //但同一id不同no的课程，有些课程信息不一样
        let tmp=this.#parseRawJson(json).map(t => CourseData.parseXGKC(t));
        return _.chain(tmp).groupBy("cid").map((t, k)=> Object.assign({},t[0],{tcList: t.map(s=>s.tcList[0])})).value();
    }
}

class CurriculaPreset {

    data;

    dataMap = new Map(); //课程id映射到CourseData
    sessions = new Map(); //考虑把解析得到的每节课信息存这，id映射到课程的所有session

    static current;

    constructor(_data) {
        this.data = _data;
        this.init();
    }

    init() {
        //初始化操作，需要解析数据中的所有课
        console.log("init");
        console.log(this.data);
        this.data.TJKC?.forEach(t => this.dataMap.set(t.cid, new CourseData(t)));
        this.data.TYKC?.forEach(t => this.dataMap.set(t.cid, new CourseData(t)));
        this.data.XGKC?.forEach(t => this.dataMap.set(t.cid, new CourseData(t)));
        //console.log(this.dataMap);
    }

    getSessions(course_id, class_id) {
        //console.log(course_id);
        //console.log(this.dataMap);
        let course = this.dataMap.get(course_id);
        //console.log(course_id, class_id,course,course.at(class_id))
        return ClassSession.resolveTeachingPlace(course_id, class_id, course.at(class_id).teachingPlace);
    }

    static getCourse(course_id) {
        return CurriculaPreset.current.dataMap.get(course_id);
    }

}

//下面需要重写当前预设获取
class PresetManager { //预设管理器，兼顾编辑器
    presets = []; //包装过的预设

    curPresetCategory = null;

    add(presetData) {
        let preset = new CurriculaPreset(presetData);
        this.presets.push(preset);
        $("#editor-select-user-preset").append(`<option>${presetData.name}</option>`)
        $("#preset-selector").append(`<option>${presetData.name}</option>`)
        $("#editor-select-user-preset").val(presetData.name);
        this.show(preset);
        $(".preset-options").html(
            this.presets.map(t => `<a>${t.data.name}</a>`).join("")
        )
    }

    remove(preset) {
        console.log("remove", preset);
        let index = this.presets.indexOf(preset);
        this.presets.removeAt(index);
        if (preset == CurriculaPreset.current) {
            if (this.presets.length == 0) {
                this.show(null);
            } else {
                this.show(index == this.presets.length ? this.presets[index - 1] : this.presets[index]);
            }
        }
        $(`#editor-select-user-preset > option:eq(${index})`).remove();
        $(`#preset-selector > option:eq(${index})`).remove();
        if (CurriculaPreset.current) {
            $("#editor-select-user-preset").val(CurriculaPreset.current.data.name);
            $("#preset-selector").val(CurriculaPreset.current.data.name);
        }
    }

    switchGlobalPresetByIndex(index) {
        let preset = this.presets[index];
        //涉及到的有：预设显示，预设编辑中的选择，右上角的显示，选课
        //其中选课的只在当前显示选课的时候加载
        $(".global-preset-select span:eq(1)").text(preset.data.name);
        if (preset != CurriculaPreset.current) {
            this.show(preset);
        }
        //console.log("switchGlobalPreset",preset.name);
        if (!$("#tab-schedule").hasClass("hide")) {
            scheduler.switchPreset(preset);
        }
    }

    switchGlobalPreset() {

    }

    //显示预设，具体到课程类别
    //这里的 preset 是 courseData 的数组
    show(preset, category = CourseCategory.TJKC) {
        console.log("show", preset, category);
        if (!preset) {
            CurriculaPreset.current = null;
            $("#preset-course-list > li").remove();
            return;
        }

        if (category == this.curPresetCategory && preset == CurriculaPreset.current) return;

        CurriculaPreset.current = preset;
        $("#preset-selector").val(CurriculaPreset.current.data.name);

        this.curPresetCategory = category;
        let subpreset = preset.data[category];
        //需要针对类别讨论
        $("#preset-course-list > div.list-item").remove();
        $("#preset-course-list > div:not(.list-item)").before(
            `${subpreset.map(t =>
                `<div class="list-item" data-cid="${t.cid}">
                        <div>
                            <button class="preset-add-class">+</button>
                            <span>${t.cid}</span>
                            <span>${t.cname}</span>
                            <span>${t.ccat}</span>
                            <span>${t.cunit}</span>
                            <span>${t.ctype}</span>
                            <span>${t.credit}学分</span>
                            <span>${t.hours}学时</span>
                        </div>
                        <div class="list">
                            ${t.tcList.map(u =>
                    `<div class="list-item" data-cno="${u.no}">
                                <span>${u.no}</span>
                                ${category == CourseCategory.TYKC ? `<span>${u.sportName}</span>` : ""}
                                <span>${u.teacher}</span>
                                <span>${u.teachingPlace}</span>
                            </div>`).join("")}

                        </div>
                    </div>`
            ).join("")}`
        );
        //点击事件
        $("#preset-course-list").click(function(e) {
            //console.log(e);
            let target=$(e.target);
            if (target.hasClass("preset-add-class")) { //增加课
                if (target.hasClass("cancel-add")) {
                    target.parent().parent().children(":last").remove();
                } else {
                    target.parent().parent().append(
                        `<div class="form-add-class">
                        <input data-cno placeholder="编号">
                        <input data-teacher placeholder="教师">
                        <input data-teachingPlace placeholder="课程时间地点" style="width: 400;">
                        <button>增加</button>
                    </div>`
                    );
                }
                target.toggleClass("cancel-add");
            } else if (e.target.nodeName=="BUTTON" && target.parent().hasClass("form-add-class")) {
                let data=Object.fromEntries(target.siblings().map((k,p)=>[[Object.keys( $(p).data())[0], $(p).val()]]).get());
                target.parent().parent().find(".cancel-add").removeClass("cancel-add");
                target.parent().remove();
            }
        });

        $("#preset-course-list > div > button").click(function () {
            let inputData = $(this).parent();
            console.log(inputData)
            $(this).parent().before(
                `<div class="list-item" data-cid="${inputData.find("input[data-cid]").val()}">
            <div>
                <span>${inputData.find("div input[data-cid]").val()}</span>
                <span>${inputData.find("input[data-cname]").val()}</span>
                <span>${inputData.find("input[data-cunit]").val()}</span>
                <span>${inputData.find("select[data-ctype]").val()}</span>
            </div>
            <div class="list">
                <div>
                    <input data-cno placeholder="编号" style="width: 60;">
                    <input data-teacher placeholder="教师" style="width: 100;">
                    <input data-place placeholder="课程时间地点" style="width: 400;">
                    <button>增加</button>
                </div>
            </div>
        </div>`
            );
        });
    }

    addCourse(cdata) { //增加课程

    }

    addClass(cid,cdata) { //增加课
        // $(`#preset-course-list list-item[data-cid="${cid}"]`).children(".list").append(
        // `<div class="list-item" data-cno="${cdata.cno}">
        //                         <span>${u.no}</span>
        //                         <span>${u.teacher}</span>
        //                         <span>${u.place}</span>
        //                     </div>`);
    }

    loadUserPresets() {
        if (localStorage.getItem("userPresets")) {
            this.presets = JSON.parse(localStorage.getItem("userPresets")).map(t => new CurriculaPreset(t));
            $("#preset-selector").html(
                this.presets.map(t => `<option>${t.data.name}</option>`).join("")
            );
            $("#editor-select-user-preset").html(
                this.presets.map(t => `<option>${t.data.name}</option>`).join("")
            );
            $(".preset-options").html(
                this.presets.map(t => `<a>${t.data.name}</a>`).join("")
            )
            $(".global-preset-select span:eq(1)").text(this.presets[0]?.data.name);
        } else {
            this.presets = [];
        }
        this.show(this.presets[0]);
    }

    saveUserPresets() {
        localStorage.setItem("userPresets", JSON.stringify(this.presets.map(t => t.data)))
    }

    getPresetByName(name) {
        return this.presets.find(t => t.data.name == name);
    }
}

var presetMngr = new PresetManager();
var systemPresets= [];