const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 成绩数据文件
const SCORES_FILE = path.join(__dirname, 'scores.json');
const BACKUP_FILE = path.join(__dirname, 'scores_backup.json');

// 简单的身份验证密钥
const ADMIN_PASSWORD = 'admin123'; // 生产环境应使用环境变量

// 文件锁，防止并发写入
let fileLock = false;

// 初始化成绩文件
if (!fs.existsSync(SCORES_FILE)) {
    fs.writeFileSync(SCORES_FILE, '[]');
}

// 管理员认证中间件
function authenticateAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
        return res.status(401).json({ error: '未授权访问' });
    }
    next();
}

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

// 启动服务器
app.listen(PORT, () => {
    console.log(`考试系统服务器运行在端口 ${PORT}`);
    console.log(`学生考试页面：/index.html`);
    console.log(`教师管理后台：/admin.html`);
});