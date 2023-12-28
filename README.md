br<!--

* @Author: 星瞳 1944637830@qq.com
* @Date: 2023-11-02 01:07:29
* @LastEditors: 星瞳 1944637830@qq.com
* @LastEditTime: 2023-12-09 21:16:44
* @FilePath: \tampermonkey\README.md
* @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE

-->

# puppeteer_Bili

## 一、木偶模块

文件中存放的抽奖链接后面根据结尾不同，操作方式也不一样。
|结尾|含义|
|---|---|
|?tab=2|需要转发+评论|
|?tab=1|只需要转发|
|无后缀|只需要评论|
>[木偶模块](./木偶模块/)
此文件夹中存放主要功能的实现文件。
>>1.1 存放的数据文件
>>>1.1.1 [必抽的大奖.txt](./木偶模块/必抽的大奖.txt)\
此文件是用来存放必抽的大奖，无关设置直接参加，格式如下:\
`https://t.bilibili.com/{动态id}` + 结尾分类\
\
1.1.2 [必抽的预约抽奖.txt](./木偶模块/必抽的预约抽奖.txt)\
此文件时用来存放预约抽奖，将预约抽奖的发起人的空间链接丢进去，格式如下：\
`https://space.bilibili.com/{upUID}`
\
1.1.3 [官方抽奖动态id.txt](./木偶模块/官方抽奖动态id.txt)\
此文件时用来存放官方转发抽奖，将动态链接丢进去，格式如下：\
`https://t.bilibili.com/{动态id}?tab=1`\
\
1.1.4 [一般的抽奖动态id.txt](./木偶模块/一般的抽奖动态id.txt)\
此文件是用来存放一般的抽奖动态id，可以通过设置，调整为参加只评论的抽奖/不参加所有一般抽奖/参加所有抽奖，格式如下:\
`https://t.bilibili.com/{动态id}` + 结尾分类\

>[UserData](./UserData/)\
此目录用于存放pptr的浏览器数据！\

>[ChatGPT](./ChatGPT/)\
此目录用于存放ChatGPT自动回复功能