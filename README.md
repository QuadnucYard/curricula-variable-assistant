# curricula-variable-assistant
A webpage assisting you with your curriculum arrangement.

# 东南大学选课助手
帮你选出不冲突的课程
网页版：[https://quadnucyard.github.io/curricula-variable-assistant/index.html](https://quadnucyard.github.io/curricula-variable-assistant/index.html)

请使用用户脚本（[grablessons.user.js](https://github.com/QuadnucYard/curricula-variable-assistant/blob/master/grablessons.user.js)）获取自己的课程数据并载入小工具。

## 使用方法
（待完善）

导入数据后可建立课程列表，选择课程即可更新课程表，会检查冲突。点选择的课程即退选。

# ChangeLog

## v0.1
创建项目，支持简单的选课并显示在课表。

## v0.2
实现选择使用预设，可以导入源数据，但无法编辑。

## v0.3
用 `Vue.js` 重构。

### v0.3.1
继续完善课程的手动增删

### v0.3.2 - 2021.12.9
适配最新版，配合用户脚本能从选课网站加载数据，但是又有课表冲突显示的bug。

# TODO List
1. 重写时间表的代码，修复一堆bug并支持保存。
2. 优化各种UI。
