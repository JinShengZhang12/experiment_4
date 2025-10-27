let cutButton, crossButton, longButton, restartButton, resetButton;
let stemCut = false;
let stemPiece = null;

let hasSeenCross = false;
let hasSeenLong = false;

let inTank = false;
let waterProgress = 0; // 0 ~ 1 表示水上升比例
let resetting = false; // 是否正在复原动画
let resetAlpha = 255;  // 渐变透明度

// tank position
let tankX = 420, tankY = 180, tankW = 120, tankH = 160; // 高度从200减到160
let baseWaterHeight = 60; // 初始水位高度（原来20，现在改成60）

function setup() {
  createCanvas(600, 500); // 固定大小

  let buttonWidth = 120;
  let buttonHeight = 50; // 按钮高度加大，确保触摸设备可以更容易点击

  // 设置按钮位置和大小，避免重叠
  cutButton = createButton("剪切");
  cutButton.position(20, 20);
  cutButton.size(buttonWidth, buttonHeight);
  cutButton.mousePressed(cutStem);

  crossButton = createButton("横切面");
  crossButton.position(160, 20);  // 调整按钮间距
  crossButton.size(buttonWidth, buttonHeight);
  crossButton.mousePressed(() => { hasSeenCross = true; });

  longButton = createButton("纵切面");
  longButton.position(300, 20);  // 调整按钮间距
  longButton.size(buttonWidth, buttonHeight);
  longButton.mousePressed(() => { hasSeenLong = true; });

  restartButton = createButton("再看一次");
  restartButton.position(440, 20); // 调整按钮位置
  restartButton.size(buttonWidth, buttonHeight);
  restartButton.mousePressed(() => {
    if (inTank) waterProgress = 0;
  });

  resetButton = createButton("复原");
  resetButton.position(580, 20); // 调整按钮位置
  resetButton.size(buttonWidth, buttonHeight);
  resetButton.mousePressed(startResetAnimation);

  // 调整按钮尺寸（延迟确保 DOM 渲染完成）
  setTimeout(() => {
    adjustButtonSize(cutButton);
    adjustButtonSize(crossButton);
    adjustButtonSize(longButton);
    adjustButtonSize(restartButton);
    adjustButtonSize(resetButton);
  }, 30);
}

// 动态调整按钮尺寸
function adjustButtonSize(button) {
  try {
    let sw = button.elt.offsetWidth || 80;
    let sh = button.elt.offsetHeight || 28;
    button.size(sw * 2, sh * 2);
  } catch (e) {
    button.size(160, 56);
  }
}

// 触摸设备支持
function touchStarted() {
  if (touches && touches.length > 0) {
    handlePress(touches[0].x, touches[0].y);
  }
  return true; // 确保不会吞掉事件
}

function touchEnded() {
  handleRelease();
  return true;
}

function handlePress(mx, my) {
  try {
    const el = document.elementFromPoint(mx, my);
    if (el === cutButton.elt || el === crossButton.elt || el === longButton.elt ||
        el === restartButton.elt || el === resetButton.elt) {
      return; // 触摸发生在按钮上时，阻止继续处理
    }
  } catch (e) {
    // 忽略错误
  }

  if (stemPiece) stemPiece.pressed(mx, my);
  // 其他元素交互代码...
}

function handleRelease() {
  if (stemPiece) stemPiece.released();
  // 其他元素交互代码...
}

function draw() {
  background(245);

  // 如果正在复原 → 渐隐
  if (resetting) {
    resetAlpha -= 10;
    if (resetAlpha <= 0) {
      performReset(); // 真正重置
      resetting = false;
    }
  } else if (resetAlpha < 255) {
    resetAlpha += 10; // 渐显
  }

  push();
  tint(255, resetAlpha); // 应用透明度给所有图形

  // 左侧原始茎
  drawOriginalStem();

  // 中央：横切面 & 纵切面
  if (hasSeenCross) drawCrossSection(250, 150, 60);
  if (hasSeenLong) drawLongSection(250, 320, 60, 140);

  // 右侧水槽
  drawTank();

  // 切下来的茎段
  if (stemPiece) {
    stemPiece.show();
    stemPiece.drag(hasSeenCross && hasSeenLong); // 必须先看完切面
    if (stemPiece.insideWater(tankX, tankY, tankW, tankH, baseWaterHeight)) {
      inTank = true;
      if (waterProgress < 1) {
        waterProgress += 0.0015; // 水逐渐上升（减半速度）
      }
    }
    fill(0);
    textAlign(CENTER);
    text("切下的茎段", stemPiece.x + stemPiece.w / 2, stemPiece.y + stemPiece.h + 15);
  }

  // 如果在水槽中 → 更新切面显示
  if (inTank) {
    if (hasSeenLong) drawLongSectionWater(250, 320, 60, 140, waterProgress);
    if (hasSeenCross) drawCrossSectionWater(250, 150, 60, waterProgress);
  }

  pop();
}

// 原始茎
function drawOriginalStem() {
  fill(80, 200, 80);
  rect(80, 120, 40, 220);
  fill(0);
  textAlign(CENTER);
  text("原始茎", 100, 360);
}

// 横切面
function drawCrossSection(x, y, r) {
  fill(230, 255, 230);
  stroke(0);
  ellipse(x, y, r*2, r*2);

  for (let angle = 0; angle < TWO_PI; angle += PI/6) {
    let bx = x + cos(angle) * (r * 0.6);
    let by = y + sin(angle) * (r * 0.6);
    fill(100, 200, 100);
    ellipse(bx, by, 14, 14);
  }

  fill(200, 150, 100);
  ellipse(x, y, r*0.8, r*0.8);

  fill(0);
  noStroke();
  textAlign(CENTER);
  text("茎的横切面", x, y + r + 20);
}

// 横切面水染色
function drawCrossSectionWater(x, y, r, p) {
  noStroke();
  fill(255, 0, 0, 120); // 红色水
  for (let angle = 0; angle < TWO_PI; angle += PI/6) {
    let bx = x + cos(angle) * (r * 0.6);
    let by = y + sin(angle) * (r * 0.6);
    ellipse(bx, by, 14*p, 14*p);
  }
}

// 纵切面
function drawLongSection(x, y, w, h) {
  stroke(0);
  fill(230,255,230);
  rect(x - w / 2, y - h / 2, w, h);

  // 画两条粗绿色线，分别位于两侧
  stroke(120, 200, 120);
  strokeWeight(4);  // 增加线的粗细
  line(x - w / 4, y - h / 2, x - w / 4, y + h / 2);  // 左侧绿色线
  line(x + w / 4, y - h / 2, x + w / 4, y + h / 2);  // 右侧绿色线

  fill(0);
  noStroke();
  textAlign(CENTER);
  text("茎的纵切面", x, y + h / 2 + 20);
}

// 纵切面水柱
function drawLongSectionWater(x, y, w, h, p) {
  noStroke();
  fill(255, 0, 0, 150); // 红色水

  // 计算水柱的高度
  let waterHeight = h * p;

  // 仅在绿色线的区域绘制水柱
  rect(x - w / 4 - 5, y + h / 2 - waterHeight, 10, waterHeight); // 左侧绿色线上的水柱
  rect(x + w / 4 - 5, y + h / 2 - waterHeight, 10, waterHeight); // 右侧绿色线上的水柱
}

// 水槽
function drawTank() {
  stroke(0);
  noFill();
  rect(tankX, tankY, tankW, tankH); // 绘制水槽

  // 绘制水位
  fill(0, 150, 255, 100);
  rect(tankX, tankY + tankH - baseWaterHeight * (1 - waterProgress), tankW, baseWaterHeight * waterProgress);
}

// 启动复原动画
function startResetAnimation() {
  resetting = true;
  resetAlpha = 255;
}

// 茎段
class StemPiece {
  constructor(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.dragging = false;
  }
  
  show() {
    fill(80, 200, 80);
    rect(this.x, this.y, this.w, this.h);
  }

  pressed(mx, my) {
    if (mx > this.x && mx < this.x + this.w && my > this.y && my < this.y + this.h) {
      this.dragging = true;
      this.offX = this.x - mx;
      this.offY = this.y - my;
    }
  }

  released() {
    this.dragging = false;
  }

  drag(canMove) {
    if (this.dragging && canMove) {
      this.x = mouseX + this.offX;
      this.y = mouseY + this.offY;
    }
  }

  insideWater(x, y, w, h, baseHeight) {
    return this.x >= x && this.x <= x + w && this.y + this.h >= y + baseHeight;
  }
}
