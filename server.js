const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 题目数据文件
const QUESTIONS_FILE = path.join(__dirname, 'questions.json');

// 成绩数据文件
const SCORES_FILE = path.join(__dirname, 'scores.json');
const BACKUP_FILE = path.join(__dirname, 'scores_backup.json');

// 从环境变量获取密码，如果不存在则使用默认值（生产环境应始终使用环境变量）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'exam_system_secret_key'; // 生产环境应使用更强的密钥

// 文件锁，防止并发写入
let fileLock = false;

// 初始化成绩文件
if (!fs.existsSync(SCORES_FILE)) {
    fs.writeFileSync(SCORES_FILE, '[]');
}

// 管理员认证中间件
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: '未授权访问：缺少令牌' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: '令牌无效或已过期' });
        }
        req.user = user;
        next();
    });
}

// 登录接口
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    
    if (!password) {
        return res.status(400).json({ error: '密码不能为空' });
    }

    if (password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: '密码错误' });
    }

    // 创建JWT令牌，设置过期时间为12小时
    const token = jwt.sign(
        { 
            username: 'admin', 
            role: 'admin',
            exp: Math.floor(Date.now() / 1000) + (12 * 60 * 60) // 12小时后过期
        }, 
        JWT_SECRET
    );

    res.json({ 
        success: true, 
        token,
        message: '登录成功' 
    });
});

// 安全的文件读取
function safeReadFile() {
    try {
        if (fs.existsSync(SCORES_FILE)) {
            return JSON.parse(fs.readFileSync(SCORES_FILE, 'utf8'));
        }
        return [];
    } catch (error) {
        console.error('读取文件失败：', error);
        // 如果主文件损坏，尝试从备份恢复
        if (fs.existsSync(BACKUP_FILE)) {
            console.log('尝试从备份文件恢复...');
            return JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
        }
        return [];
    }
}

// 安全的文件写入
function safeWriteFile(data) {
    return new Promise((resolve, reject) => {
        if (fileLock) {
            return reject(new Error('文件正在被写入，请稍后重试'));
        }
        
        fileLock = true;
        try {
            // 先创建备份
            if (fs.existsSync(SCORES_FILE)) {
                fs.copyFileSync(SCORES_FILE, BACKUP_FILE);
            }
            
            // 写入主文件
            fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2));
            fileLock = false;
            resolve();
        } catch (error) {
            fileLock = false;
            console.error('写入文件失败：', error);
            reject(error);
        }
    });
}

// 获取题目API
app.get('/api/questions', (req, res) => {
    try {
        if (!fs.existsSync(QUESTIONS_FILE)) {
            return res.status(404).json({ error: '题目文件不存在' });
        }
        
        const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
        res.json(questions);
    } catch (error) {
        console.error('获取题目错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 验证学生数据
function validateStudentData(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('姓名不能为空');
    }
    
    if (!data.className || typeof data.className !== 'string' || data.className.trim().length === 0) {
        errors.push('班级不能为空');
    }
    
    if (!data.studentNumber || typeof data.studentNumber !== 'string' || data.studentNumber.trim().length === 0) {
        errors.push('学号不能为空');
    }
    
    // 验证学号格式（只允许字母、数字）
    if (data.studentNumber && !/^[a-zA-Z0-9]+$/.test(data.studentNumber)) {
        errors.push('学号只能包含字母和数字');
    }
    
    // 验证分数
    if (typeof data.score !== 'number' || data.score < 0 || data.score > 100) {
        errors.push('分数必须在0-100之间');
    }
    
    // 验证题数
    if (typeof data.correctCount !== 'number' || data.correctCount < 0) {
        errors.push('正确题数不能为负数');
    }
    
    if (typeof data.wrongCount !== 'number' || data.wrongCount < 0) {
        errors.push('错误题数不能为负数');
    }
    
    if (typeof data.unansweredCount !== 'number' || data.unansweredCount < 0) {
        errors.push('未答题数不能为负数');
    }
    
    return errors;
}

// 提交成绩API
app.post('/api/submit', async (req, res) => {
    try {
        const examData = req.body;
        
        // 添加未答题数
        examData.unansweredCount = examData.unansweredCount || 0;
        
        // 验证数据
        const validationErrors = validateStudentData(examData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ error: validationErrors.join('; ') });
        }

        // 读取现有成绩
        const scores = safeReadFile();
        
        // 检查是否已存在该学号的成绩
        const existingIndex = scores.findIndex(s => s.studentNumber === examData.studentNumber);
        
        // 提交保护：限制提交次数（最多3次）
        if (existingIndex !== -1) {
            const existingScore = scores[existingIndex];
            if (!existingScore.submitCount) {
                existingScore.submitCount = 1;
            }
            
            if (existingScore.submitCount >= 3) {
                return res.status(403).json({ error: '该学号已达到最大提交次数（3次）' });
            }
            
            // 更新已有成绩
            scores[existingIndex] = {
                ...examData,
                submitCount: existingScore.submitCount + 1,
                updatedAt: new Date().toISOString(),
                createdAt: existingScore.createdAt
            };
        } else {
            // 添加新成绩
            scores.push({
                ...examData,
                submitCount: 1,
                createdAt: new Date().toISOString()
            });
        }

        // 保存成绩（使用异步安全写入）
        await safeWriteFile(scores);

        res.json({ 
            success: true, 
            message: '成绩提交成功',
            data: examData,
            submitCount: existingIndex !== -1 ? scores[existingIndex].submitCount : 1
        });
    } catch (error) {
        console.error('提交成绩错误：', error);
        res.status(500).json({ error: '服务器错误，请稍后重试' });
    }
});

// 获取所有成绩API（教师后台）
app.get('/api/scores', authenticateAdmin, (req, res) => {
    try {
        const scores = safeReadFile();
        res.json(scores);
    } catch (error) {
        console.error('获取成绩错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 删除成绩API（教师后台）
app.delete('/api/scores/:studentNumber', authenticateAdmin, async (req, res) => {
    try {
        const { studentNumber } = req.params;
        
        if (!studentNumber) {
            return res.status(400).json({ error: '学号不能为空' });
        }
        
        const scores = safeReadFile();
        const filteredScores = scores.filter(s => s.studentNumber !== studentNumber);
        
        if (filteredScores.length === scores.length) {
            return res.status(404).json({ error: '未找到该学号的成绩' });
        }
        
        await safeWriteFile(filteredScores);
        
        res.json({ success: true, message: '成绩删除成功' });
    } catch (error) {
        console.error('删除成绩错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 清空所有成绩API（教师后台）
app.delete('/api/scores', authenticateAdmin, async (req, res) => {
    try {
        // 创建备份
        if (fs.existsSync(SCORES_FILE)) {
            fs.copyFileSync(SCORES_FILE, BACKUP_FILE);
        }
        
        await safeWriteFile([]);
        
        res.json({ success: true, message: '所有成绩已清空' });
    } catch (error) {
        console.error('清空成绩错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取统计信息API
app.get('/api/stats', authenticateAdmin, (req, res) => {
    try {
        const scores = safeReadFile();
        
        if (scores.length === 0) {
            return res.json({
                totalStudents: 0,
                averageScore: 0,
                maxScore: 0,
                minScore: 0,
                passRate: 0
            });
        }

        const totalStudents = scores.length;
        const averageScore = (scores.reduce((sum, s) => sum + s.score, 0) / totalStudents).toFixed(2);
        const maxScore = Math.max(...scores.map(s => s.score));
        const minScore = Math.min(...scores.map(s => s.score));
        const passCount = scores.filter(s => s.score >= 60).length;
        const passRate = ((passCount / totalStudents) * 100).toFixed(2);

        res.json({
            totalStudents,
            averageScore,
            maxScore,
            minScore,
            passRate
        });
    } catch (error) {
        console.error('获取统计信息错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取单个学生的错题详情API
app.get('/api/scores/:studentNumber/details', authenticateAdmin, (req, res) => {
    try {
        const { studentNumber } = req.params;
        
        if (!studentNumber) {
            return res.status(400).json({ error: '学号不能为空' });
        }
        
        const scores = safeReadFile();
        const studentScore = scores.find(s => s.studentNumber === studentNumber);
        
        if (!studentScore) {
            return res.status(404).json({ error: '未找到该学号的成绩' });
        }

        // 如果没有答题详情，返回提示
        if (!studentScore.answerDetails || studentScore.answerDetails.length === 0) {
            return res.json({
                studentInfo: {
                    name: studentScore.name,
                    className: studentScore.className,
                    studentNumber: studentScore.studentNumber,
                    score: studentScore.score,
                    submitTime: studentScore.submitTime
                },
                wrongQuestions: [],
                unansweredQuestions: [],
                hasDetails: false
            });
        }

        // 筛选出错题和未答题
        const wrongQuestions = studentScore.answerDetails.filter(q => !q.isCorrect && !q.isUnanswered);
        const unansweredQuestions = studentScore.answerDetails.filter(q => q.isUnanswered);

        res.json({
            studentInfo: {
                name: studentScore.name,
                className: studentScore.className,
                studentNumber: studentScore.studentNumber,
                score: studentScore.score,
                correctCount: studentScore.correctCount,
                wrongCount: studentScore.wrongCount,
                unansweredCount: studentScore.unansweredCount,
                submitTime: studentScore.submitTime
            },
            wrongQuestions: wrongQuestions,
            unansweredQuestions: unansweredQuestions,
            hasDetails: true
        });
    } catch (error) {
        console.error('获取错题详情错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取所有题目的错误率统计API
app.get('/api/analysis/question-stats', authenticateAdmin, (req, res) => {
    try {
        const scores = safeReadFile();
        
        if (scores.length === 0) {
            return res.json({
                totalStudents: 0,
                questionStats: []
            });
        }

        // 只统计有答题详情的成绩
        const scoresWithDetails = scores.filter(s => s.answerDetails && s.answerDetails.length > 0);
        
        if (scoresWithDetails.length === 0) {
            return res.json({
                totalStudents: scores.length,
                questionStats: [],
                message: '暂无答题详情数据'
            });
        }

        // 统计每道题的错误情况
        const questionMap = new Map();

        scoresWithDetails.forEach(score => {
            if (score.answerDetails) {
                score.answerDetails.forEach(detail => {
                    const key = detail.questionId;
                    if (!questionMap.has(key)) {
                        questionMap.set(key, {
                            questionId: key,
                            questionType: detail.questionType,
                            question: detail.question,
                            correctAnswer: detail.correctAnswer,
                            totalAttempts: 0,
                            correctCount: 0,
                            wrongCount: 0,
                            unansweredCount: 0,
                            wrongRate: 0,
                            studentAnswers: []
                        });
                    }

                    const stat = questionMap.get(key);
                    stat.totalAttempts++;

                    if (detail.isCorrect) {
                        stat.correctCount++;
                    } else if (detail.isUnanswered) {
                        stat.unansweredCount++;
                    } else {
                        stat.wrongCount++;
                        // 记录错误答案（用于分析常见错误）
                        if (detail.studentAnswer) {
                            stat.studentAnswers.push({
                                studentNumber: score.studentNumber,
                                studentName: score.name,
                                answer: detail.studentAnswer
                            });
                        }
                    }
                });
            }
        });

        // 计算错误率并排序
        const questionStats = Array.from(questionMap.values()).map(stat => {
            stat.wrongRate = ((stat.wrongCount / stat.totalAttempts) * 100).toFixed(2);
            return stat;
        });

        // 按错误率降序排序
        questionStats.sort((a, b) => parseFloat(b.wrongRate) - parseFloat(a.wrongRate));

        res.json({
            totalStudents: scoresWithDetails.length,
            questionStats: questionStats
        });
    } catch (error) {
        console.error('获取题目统计错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 获取班级错题分析API
app.get('/api/analysis/class-stats', authenticateAdmin, (req, res) => {
    try {
        const scores = safeReadFile();
        
        if (scores.length === 0) {
            return res.json({
                classStats: []
            });
        }

        // 按班级分组统计
        const classMap = new Map();

        scores.forEach(score => {
            const className = score.className || '未知班级';
            if (!classMap.has(className)) {
                classMap.set(className, {
                    className: className,
                    studentCount: 0,
                    totalScore: 0,
                    averageScore: 0,
                    totalWrong: 0,
                    totalUnanswered: 0,
                    students: []
                });
            }

            const classStat = classMap.get(className);
            classStat.studentCount++;
            classStat.totalScore += score.score;
            classStat.totalWrong += score.wrongCount || 0;
            classStat.totalUnanswered += score.unansweredCount || 0;
            
            classStat.students.push({
                name: score.name,
                studentNumber: score.studentNumber,
                score: score.score,
                wrongCount: score.wrongCount || 0,
                unansweredCount: score.unansweredCount || 0
            });
        });

        // 计算平均分
        const classStats = Array.from(classMap.values()).map(stat => {
            stat.averageScore = (stat.totalScore / stat.studentCount).toFixed(2);
            return stat;
        });

        // 按班级名称排序
        classStats.sort((a, b) => a.className.localeCompare(b.className, 'zh-CN'));

        res.json({
            classStats: classStats
        });
    } catch (error) {
        console.error('获取班级统计错误：', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 导出app实例以支持测试
module.exports = app;

// 只在直接运行此文件时才启动服务器（而不是被require时）
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`考试系统服务器运行在端口 ${PORT}`);
        console.log(`学生考试页面：/index.html`);
        console.log(`教师管理后台：/admin_login.html`); // 更新登录页面路径
    });
}