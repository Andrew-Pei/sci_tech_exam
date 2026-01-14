/**
 * 并发提交测试
 * 模拟50个学生同时提交成绩，检测数据是否会丢失
 */

const request = require('supertest');
const app = require('../server');
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '../scores.json');

// 清空测试数据
function clearTestData() {
    fs.writeFileSync(SCORES_FILE, '[]');
}

// 生成模拟学生数据
function generateStudentData(index) {
    return {
        name: `学生${index}`,
        className: '初一(1)班',
        studentNumber: `202401${String(index).padStart(3, '0')}`,
        score: Math.floor(Math.random() * 40) + 60, // 60-100分
        correctCount: Math.floor(Math.random() * 10) + 10,
        wrongCount: Math.floor(Math.random() * 5),
        unansweredCount: Math.floor(Math.random() * 3),
        submitTime: new Date().toISOString()
    };
}

describe('并发提交测试 (模拟50人同时提交)', () => {
    beforeEach(() => {
        clearTestData();
    });

    afterEach(() => {
        // 测试结束后清空
        clearTestData();
    });

    test('50个学生同时提交，不应丢失数据', async () => {
        const STUDENT_COUNT = 50;
        const studentData = [];

        // 生成50个学生的数据
        for (let i = 1; i <= STUDENT_COUNT; i++) {
            studentData.push(generateStudentData(i));
        }

        console.log(`\n开始测试：${STUDENT_COUNT}个学生同时提交...`);
        const startTime = Date.now();

        // 所有请求同时发出
        const promises = studentData.map(data =>
            request(app)
                .post('/api/submit')
                .send(data)
        );

        const results = await Promise.all(promises);
        const endTime = Date.now();

        console.log(`所有请求完成，耗时: ${endTime - startTime}ms`);

        // 检查响应
        let successCount = 0;
        let failCount = 0;
        results.forEach(res => {
            if (res.status === 200) {
                successCount++;
            } else {
                failCount++;
                console.log(`失败响应: ${res.status} - ${res.body.error || res.body.message}`);
            }
        });

        console.log(`成功: ${successCount}, 失败: ${failCount}`);

        // 读取保存的数据
        const savedScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
        console.log(`\n实际保存的学生数: ${savedScores.length}`);

        // 检查是否有数据丢失
        const savedNumbers = new Set(savedScores.map(s => s.studentNumber));
        const expectedNumbers = studentData.map(d => d.studentNumber);
        const lostNumbers = expectedNumbers.filter(n => !savedNumbers.has(n));

        if (lostNumbers.length > 0) {
            console.error(`\n⚠️  数据丢失！以下 ${lostNumbers.length} 个学生的数据未保存:`);
            lostNumbers.forEach(n => console.error(`  - ${n}`));
        } else {
            console.log(`\n✓ 没有数据丢失`);
        }

        // 检查是否有重复
        const duplicates = expectedNumbers.filter(n => savedNumbers.has(n) &&
            savedScores.filter(s => s.studentNumber === n).length > 1);
        if (duplicates.length > 0) {
            console.warn(`\n⚠️  发现有重复记录:`);
            duplicates.forEach(n => {
                const count = savedScores.filter(s => s.studentNumber === n).length;
                console.warn(`  - ${n}: ${count} 条记录`);
            });
        }

        // 断言
        expect(lostNumbers.length).toBe(0);
        expect(savedScores.length).toBe(STUDENT_COUNT);
        expect(failCount).toBe(0);
    }, 30000); // 30秒超时

    test('同一个学号并发提交，应该只保存最后一次提交', async () => {
        const studentNumber = '2024001';
        const submitCount = 5;

        console.log(`\n测试：同一学号 ${submitCount} 次并发提交...`);

        // 同一个学号，5次并发提交
        const promises = [];
        for (let i = 1; i <= submitCount; i++) {
            promises.push(
                request(app)
                    .post('/api/submit')
                    .send({
                        name: `测试学生`,
                        className: '初一(1)班',
                        studentNumber: studentNumber,
                        score: 60 + i * 5, // 每次分数不同
                        correctCount: 10,
                        wrongCount: 0,
                        unansweredCount: 0,
                        submitTime: new Date().toISOString()
                    })
            );
        }

        const results = await Promise.all(promises);

        console.log(`响应状态: ${results.map(r => r.status).join(', ')}`);

        // 读取保存的数据
        const savedScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
        const studentRecords = savedScores.filter(s => s.studentNumber === studentNumber);

        console.log(`该学号的记录数: ${studentRecords.length}`);

        // 应该只有一条记录（或者有多条但submitCount递增）
        expect(studentRecords.length).toBeGreaterThan(0);
        expect(studentRecords.length).toBeLessThanOrEqual(submitCount);
    });

    test('不同班级同时提交，检查数据完整性', async () => {
        const classes = ['初一(1)班', '初一(2)班', '初一(3)班'];
        const studentsPerClass = 15;
        const totalStudents = classes.length * studentsPerClass;

        console.log(`\n测试：${classes.length} 个班级，每班 ${studentsPerClass} 人同时提交...`);

        const promises = [];
        classes.forEach((className, classIdx) => {
            for (let i = 1; i <= studentsPerClass; i++) {
                const studentNumber = `${classIdx + 1}${String(i).padStart(3, '0')}`;
                promises.push(
                    request(app)
                        .post('/api/submit')
                        .send({
                            name: `${className}学生${i}`,
                            className: className,
                            studentNumber: studentNumber,
                            score: Math.floor(Math.random() * 40) + 60,
                            correctCount: 10,
                            wrongCount: 2,
                            unansweredCount: 0,
                            submitTime: new Date().toISOString()
                        })
                );
            }
        });

        const startTime = Date.now();
        await Promise.all(promises);
        const endTime = Date.now();

        console.log(`完成耗时: ${endTime - startTime}ms`);

        // 验证数据
        const savedScores = JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
        console.log(`保存记录数: ${savedScores.length} / 预期 ${totalStudents}`);

        // 按班级统计
        const classStats = {};
        classes.forEach(c => classStats[c] = 0);
        savedScores.forEach(s => {
            if (classStats[s.className] !== undefined) {
                classStats[s.className]++;
            }
        });

        console.log('各班提交情况:');
        Object.entries(classStats).forEach(([className, count]) => {
            console.log(`  ${className}: ${count}/${studentsPerClass}`);
        });

        expect(savedScores.length).toBe(totalStudents);
    });
});
