-- 创建电影表
CREATE TABLE movies (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    director NVARCHAR(255),
    actor NVARCHAR(255),
    type NVARCHAR(100),
    score DECIMAL(3,1),
    image NVARCHAR(MAX),
    description NVARCHAR(MAX)
);

-- 创建索引以提高查询性能
CREATE INDEX IX_movies_type ON movies(type);
CREATE INDEX IX_movies_director ON movies(director);
CREATE INDEX IX_movies_actor ON movies(actor);
CREATE INDEX IX_movies_score ON movies(score);

-- 插入示例数据
INSERT INTO movies (title, director, actor, type, score, image, description) VALUES
('肖申克的救赎', '弗兰克·德拉邦特', '蒂姆·罗宾斯', '剧情', 9.7, 'https://example.com/shawshank.jpg', '银行家安迪被误判杀害妻子，在肖申克监狱中度过漫长岁月，最终通过智慧和毅力获得自由。'),
('教父', '弗朗西斯·福特·科波拉', '马龙·白兰度', '犯罪', 9.6, 'https://example.com/godfather.jpg', '黑手党家族的故事，展现了权力、家族和背叛的复杂关系。'),
('盗梦空间', '克里斯托弗·诺兰', '莱昂纳多·迪卡普里奥', '科幻', 9.3, 'https://example.com/inception.jpg', '一个关于梦境和现实的故事，探讨了人类意识的深层奥秘。'),
('泰坦尼克号', '詹姆斯·卡梅隆', '莱昂纳多·迪卡普里奥', '爱情', 9.4, 'https://example.com/titanic.jpg', '1912年泰坦尼克号邮轮上的爱情故事，展现了跨越阶级的真挚感情。'),
('阿甘正传', '罗伯特·泽米吉斯', '汤姆·汉克斯', '剧情', 9.5, 'https://example.com/forrest-gump.jpg', '一个智商只有75的男人，却经历了美国历史上许多重要事件。'),
('星际穿越', '克里斯托弗·诺兰', '马修·麦康纳', '科幻', 9.2, 'https://example.com/interstellar.jpg', '在人类面临灭绝危机时，一组宇航员穿越虫洞寻找新的家园。'),
('指环王：王者归来', '彼得·杰克逊', '伊利亚·伍德', '奇幻', 9.0, 'https://example.com/lotr.jpg', '中土世界的最终决战，弗罗多必须将魔戒带到末日火山销毁。'),
('黑客帝国', '沃卓斯基姐妹', '基努·里维斯', '科幻', 9.1, 'https://example.com/matrix.jpg', '一个关于虚拟现实和人工智能的哲学思考。'),
('美丽人生', '罗伯托·贝尼尼', '罗伯托·贝尼尼', '剧情', 9.5, 'https://example.com/life-is-beautiful.jpg', '在纳粹集中营中，父亲用游戏的方式保护儿子的纯真。'),
('千与千寻', '宫崎骏', '柊瑠美', '动画', 9.4, 'https://example.com/spirited-away.jpg', '少女千寻在神秘世界中寻找父母的故事，充满了奇幻和温情。');

-- 查看插入的数据
SELECT * FROM movies ORDER BY score DESC; 