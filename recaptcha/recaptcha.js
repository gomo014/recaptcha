const html = document.getElementsByTagName('html');
const wrapper = document.querySelector('.wrapper');
const recaptcha = document.querySelector('.recaptcha');
const modal = document.querySelector('.modal');
const box = document.querySelector(".box");
const boxCircle = document.querySelector(".boxCircle");
const textModal = document.querySelector(".textModal");
const container = document.querySelector('.wrapper');
const checkBox = document.getElementById('checkBox');
const labelforCheckBox = document.querySelector('.labelforCheckBox');
const confirmButton = document.getElementById('confirmButton');
const labelforConfirmButton = document.querySelector('#labelforConfirmButton');
const imgTagsInContainer1 = document.querySelector('.imgContainer1').getElementsByTagName('img');
const imgTagsInContainer2 = document.querySelector('.imgContainer2').getElementsByTagName('img');
const correctnessCheckOriginal = JSON.parse(JSON.stringify(correctnessCheck));
const numberOfQuestionsOriginal = JSON.parse(JSON.stringify(numberOfQuestions));
const popperLeft = document.querySelector('#popperLeft');
const popperRight = document.querySelector('#popperRight');

let firstOpen = true;
let reanswer = false;
let modalOffFlag = false;
let initialPosition = true;
let restoreMovement = true;
let formerMouseX;
let formerMouseY;
let checkBoxStyleX = 0;
let checkBoxStyleY = 0;
let rectX;
let rectY;
let nextImage = 10;
let numberOfIncorrect = 0;
let currentQuestion = 1;
let nextQuestionNumber = 2;
let numberOfDisplayedQuestions = 1;
let currentQuestionString;
let currentQuestionData1;
let currentQuestionData2;
let formerRecaptchaX;
let formerRecaptchaY;
let timerIds = [];

/**************************************************************************************************************************************************
 * モーダル表示処理
 *************************************************************************************************************************************************/

//初回表示時
modal.style.display = checkBox.checked ? "block" : "none";

//チェックボックス押下時
checkBox.addEventListener('change', modalDisplay);
function modalDisplay() {
    modal.style.display = this.checked ? "block" : "none";
    modal.style.animation = this.checked ? "fadein 0.4s ease forwards" : "none";

    //初回押下時（２巡目以降の初回を含む）のみアニメーション動作
    if (this.checked && firstOpen) {
        box.style.animation = "checkBox-anim 0.4s";
        box.addEventListener('animationend', () => {
            box.style.animation = "";
        });
        boxCircle.style.animation = "checkBoxCircle-anim 0.3s";
        boxCircle.style.display = "block";
        boxCircle.addEventListener('animationend', () => {
            boxCircle.style.display = "none";
        });
        firstOpen = false;

        //２巡目以降であればチェックボックス、エラー、メッセージの表示を元に戻す
        if (reanswer) {
            box.style.borderColor = "";
            box.style.top = 0;
            document.querySelector(".textModalError").style.display = "none";
            textModal.style.top = 0;
        }
    }
}

/**************************************************************************************************************************************************
 *  クリックイベントの処理
 * 
 *  モーダル表示/質問画像の押下/モーダル内確認ボタンの押下
 *************************************************************************************************************************************************/

function clickEvent(e) {
    //余白をクリックした際にモーダルを消す
    if (e.target === html[0] || e.target === wrapper || e.target === recaptcha) {
        handleEmptySpaceClick();
    }

    //モーダル表示時、recaptcha内(モーダル含)をクリックした際のモーダル表示を制御
    if (modal.style.display !== "none") {
        handleModalClick(e.target);
    }

    //質問の画像を押下する時の処理
    if (Array.from(imgTagsInContainer1).includes(e.target)) {
        handleImageClick(e);
    }

    //確認ボタン押下時の処理
    if (e.target === confirmButton) {
        handleConfirmButtonClick();
    }

    //モーダルを再表示した際に、画像のフェードインアニメーションが再開してしまうことを防ぐ
    if (modal.style.display === "none" && e.target === checkBox) {
        Array.from(imgTagsInContainer1).forEach(img => { img.style.animation = "" });
    }
};


/************************************
 * 余白をクリックした際にモーダルを消す
 ***********************************/
function handleEmptySpaceClick() {
    checkBox.checked = false;
    modal.style.animation = "fadeout 0.5s ease forwards";
    modal.addEventListener('animationend', () => {
        if (checkBox.checked === false) {
            modal.style.display = "none";
        }
    });
}

/************************************
* モーダル表示時、recaptcha内クリックの処理
*
* recaptcha内(モーダル含)をクリックしたとき、クリックした要素とcheckBoxで２回クリック判定がされる。
 ***********************************/
function handleModalClick(target) {

    //モーダル含まないrecaptcha部分(labelforCheckBox)もしくは灰色枠線のボックス(box)を押下した際、モーダル閉じる
    if (target === labelforCheckBox || target === box) {
        modalOffFlag = true;
        //モーダル内を押下した場合、モーダルを閉じない
    } else if (target !== labelforCheckBox && target !== checkBox) {
        modalOffFlag = false;
        //２回目のクリック判定時（checkBox）、モーダル開閉の処理を行う
    } else if (target === checkBox && !modalOffFlag) {
        checkBox.checked = true;
    } else if (target === checkBox && modalOffFlag) {
        checkBox.checked = false;
    }
}

/************************************
 * 画像クリック時の処理
 * @param e クリックされた画像要素
 ***********************************/
function handleImageClick(e) {
    const numberOfImgs = correctnessCheck[currentQuestionData1.name].length;
    const nextImgPreserved = nextImage;
    const imgId = e.target.alt;

    //次に画像が表示される場合
    if (numberOfImgs >= nextImage) {
        //前の画像の表示フラグをオフ
        correctnessCheck[currentQuestionData1.name].find(item => item.name === imgId).isLastlyDisplayed = false;
        //間違いの画像を押したら、誤答数を足す
        if (correctnessCheck[currentQuestionData1.name].some(item => item.name === imgId && item.isCorrect === false)) {
            numberOfIncorrect++;
        }
        //前の画像のフェードアウト後、次の画像を書き換え
        timerIds.push(setTimeout(nextImageSetting, 2000));
        function nextImageSetting() {
            e.target.src = "img/" + currentQuestionData1.name + "/" + (nextImgPreserved).toString() + ".jpg";
            e.target.alt = nextImgPreserved;
            e.target.style.animation = "fadein 4s ease forwards";
        }
        //押下した画像はクリック済みフラグをつけてフェードアウト
        correctnessCheck[currentQuestionData1.name].find(item => item.name === imgId).isClicked = true;
        e.target.style.animation = "fadeout 2s ease";
        //次の画像の表示フラグをつける
        correctnessCheck[currentQuestionData1.name].find(item => item.name === nextImage.toString()).isLastlyDisplayed = true;
        nextImage++;
    } else {
        //画像を全て押したらエラーメッセージ表示
        showErrorMessage();
        return;
    }
    //画像を押下したらエラーメッセージを消す（画像を全て押した時のエラーを除く）
    modal.style.height = 530 + "px";
    document.querySelector(".errorMessage").style.display = "none";
    document.querySelector(".border").style.top = 470 + "px";
    labelforConfirmButton.style.top = 480 + "px";
}

/**
 * 画像を全て押したら不正解のエラーメッセージ表示
 */
function showErrorMessage() {
    document.querySelector(".errorNextQuestion").style.display = "block";
    modal.style.height = 560 + "px";
    document.querySelector(".border").style.top = 500 + "px";
    labelforConfirmButton.style.top = 510 + "px";
}

/************************************
 * 確認ボタンクリック時の処理
 ***********************************/
function handleConfirmButtonClick() {
    //正誤判定 表示されている正解の画像を押していないか、間違いの画像を押したとき誤答
    const incorrect = correctnessCheck[currentQuestionData1.name].find(item => item.isCorrect === true && item.isClicked === false && item.isLastlyDisplayed === true)
        || correctnessCheck[currentQuestionData1.name].find(item => item.isCorrect === false && item.isClicked === true);

    if (incorrect) {
        handleNextQuestion();
    } else {
        handleCorrectAnswer();
    }
}

/**
 * 確認ボタン押下で誤答時の処理
 */
function handleNextQuestion() {
    //最後の質問以外は次の質問を設定する
    if (currentQuestion === 1 || numberOfDisplayedQuestions < 6) {
        nextQuestion();
    } else {
        //最後の質問を間違えた場合、モーダルを閉じ質問データをリセット
        resetRecaptcha();
    }
}

/**
 * 確認ボタン押下で正解時の処理
 */
function handleCorrectAnswer() {
    checkBox.checked = false;
    //モーダルを閉じる&閉じる際のアニメーション
    modal.style.animation = "fadeout 0.5s ease forwards";
    modal.addEventListener('animationend', onAnimationEnd);
    function onAnimationEnd() {
        if (checkBox.checked === false) {
            modal.style.display = "none";
        }
        modal.removeEventListener('animationend', onAnimationEnd);
    }
    //正解後は再度モーダルを開かせない
    checkBox.removeEventListener('change', modalDisplay);

    //チェックのアニメーション
    box.style.animation = "checkBox-anim-check 0.3s";
    box.addEventListener('animationend', () => {
        box.style.animation = "";
        box.style.display = "none";
    });
    boxCircle.style.display = "block";
    boxCircle.style.animation = "checkBoxCircle-anim 0.3s";
    boxCircle.addEventListener('animationend', () => {
        boxCircle.style.display = "none";
        document.querySelector(".check").style.display = "block";
        document.querySelector(".check").style.animation = "check ease .3s forwards";
    });

    //クラッカー位置&調整表示
    setTimeout(function () {
        const clientRect = wrapper.getBoundingClientRect();
        popperLeft.style.display = "block";
        popperRight.style.display = "block";
        popperLeft.style.left = (clientRect.width / 2 - 430) + "px";
        popperRight.style.right = (clientRect.width / 2 - 430) + "px";
    }, 2500);
    setTimeout(function () {
        popperLeft.src = "img/popper.png";
        popperRight.src = "img/popper.png";
    }, 4730);
}

/**
 * 次の質問に移る際の表示&データ処理
 * 
 * currentQuestion インクリメント前は回答した質問番号、インクリメント後は次に回答する質問番号
 * nextQuestionNumber 次々回に回答する質問の番号(スライド動作のため、右側のモーダル外非表示部分に設定する質問)
 * numberOfDisplayedQuestions 表示した質問数 3問目回答時から使用
 * 
 */
function nextQuestion() {

    currentQuestionData1.isAnswered = true;

    //エラーメッセージ制御
    modal.style.height = 560 + "px";
    document.querySelector(".errorMessage").style.display = "block";
    document.querySelector(".errorNextQuestion").style.display = "none";
    document.querySelector(".border").style.top = 500 + "px";
    labelforConfirmButton.style.top = 510 + "px";

    //スライドアニメーション
    for (let imgCount = 0; imgCount < 9; imgCount++) {
        imgTagsInContainer1[imgCount].style.animation = "slide-out 0.6s ease";
        imgTagsInContainer2[imgCount].style.animation = "slide-in 0.6s ease";
    }

    //確認ボタンのアニメーション(&アニメーション中の制御)
    confirmButton.disabled = true;
    labelforConfirmButton.style.animation = "confirmButton-anim 0.6s ease";
    setTimeout(function () {
        confirmButton.disabled = false,
            labelforConfirmButton.style.animation = ""
    }, 600);

    //画像のフェードイン動作をキャンセル
    for (timerId of timerIds) {
        clearTimeout(timerId);
        timerIds = [];
    }

    //currentQuestionとnextQuestionNumberを設定
    if (currentQuestion < 2) {
        //1問目回答時、2問目、3問目の設定　順番通りに出す
        currentQuestion++;
        nextQuestionNumber = currentQuestion + 1;
    } else if (currentQuestion === 2) {
        //2問目回答時、3問目、4問目の設定　3問目は順番通りに出すが、4問目は未回答質問からランダムに選択
        currentQuestion++;
        numberOfDisplayedQuestions = currentQuestion;
        const notAnsweredQuestions = numberOfQuestions.filter(item => !item.isAnswered && !(item.id === "03")).map(item => item.id);
        nextQuestionNumber = parseInt(notAnsweredQuestions[Math.floor(Math.random() * notAnsweredQuestions.length)]);
    } else if (numberOfDisplayedQuestions < 6) {
        //3問目以降の回答時 4問目以降の設定は未回答質問からランダムに選択

        //次に使用する質問は、前回設定したnextQuestionNumberを使用する（次々回の質問→次の質問となるため）
        currentQuestion = nextQuestionNumber;
        if (currentQuestion < 10) {
            currentQuestionString = "0" + currentQuestion.toString();
        } else {
            currentQuestionString = currentQuestion.toString();
        }
        const notAnsweredNextQuestions = numberOfQuestions.filter(item => !item.isAnswered && !(item.id === currentQuestionString)).map(item => item.id);
        nextQuestionNumber = parseInt(notAnsweredNextQuestions[Math.floor(Math.random() * notAnsweredNextQuestions.length)]);
        numberOfDisplayedQuestions++;
    }

    //質問遷移時の各パラーメータを更新
    questionNameSetting()

    //画像とタイトル書き換え
    rewrite(0);
}

/**
 * 最後の質問を間違えた際にモーダル表示と質問データをリセットする
 */
function resetRecaptcha() {

    checkBox.checked = false;

    //画像押下後の画像書き換え処理をキャンセル
    for (timerId of timerIds) {
        clearTimeout(timerId);
        timerIds = [];
    }

    //確認ボタン押下後、ボタンや画像の連打で、リセット後に不具合が発生することを防ぐ
    checkBox.removeEventListener('change', modalDisplay);
    wrapper.removeEventListener('click', clickEvent);

    setTimeout(() => {
        checkBox.addEventListener('change', modalDisplay);
        wrapper.addEventListener('click', clickEvent);
    }, 1000);

    //モーダルを消す
    modal.style.animation = "fadeout 0.5s ease forwards";
    modal.addEventListener('animationend', onAnimationEnd);
    function onAnimationEnd() {
        if (checkBox.checked === false) {
            modal.style.display = "none";
        }
        modal.removeEventListener('animationend', onAnimationEnd);
    }

    //試行回数エラーを表示
    document.querySelector(".textModalError").style.display = "block";
    box.style.borderColor = "#fd4747";
    box.style.top = 20 + "px";
    textModal.style.position = "relative";
    textModal.style.top = 10 + "px";
    firstOpen = true;
    reanswer = true;

    //次回回答時のためにモーダル内のエラーを消す
    modal.style.height = 530 + "px";
    document.querySelector(".errorMessage").style.display = "none";
    document.querySelector(".errorNextQuestion").style.display = "none";
    document.querySelector(".border").style.top = 470 + "px";
    labelforConfirmButton.style.top = 480 + "px";

    //各パラメーターリセット
    currentQuestionString = currentQuestionData1 = currentQuestionData2 = null;
    currentQuestion = 1;
    numberOfDisplayedQuestions = 1;
    nextQuestionNumber = 2;
    correctnessCheck = JSON.parse(JSON.stringify(correctnessCheckOriginal));
    numberOfQuestions = JSON.parse(JSON.stringify(numberOfQuestionsOriginal));

    //画像のaltタグをリセット
    for (let i = 0; i < 9; i++) {
        imgTagsInContainer1[i].alt = "0" + (i + 1);
    }

    //質問データ更新（リセット）
    questionNameSetting();

    //画像とタイトル書き換え(モーダル非表示後)
    setTimeout(() => { rewrite(0) }, 400);
}

/**
 * 質問遷移時の各パラーメータを設定・更新
 * 
 * currentQuestionData1 次に回答する質問
 * currentQuestionData2 次の次に回答する質問（質問画像の右側（モーダル外非表示）に設定する。スライド動作で必要）
 */

function questionNameSetting() {
    let currentQuestionString1;
    let currentQuestionString2;

    nextImage = 10;
    numberOfIncorrect = 0;

    //次の質問が設定されている場合、現在の質問のnameを取得
    if (!currentQuestion) {
        currentQuestionString1 = null;
    } else if (currentQuestion < 10) {
        currentQuestionString1 = "question0" + currentQuestion.toString();
    } else if (10 <= nextQuestionNumber) {
        currentQuestionString1 = "question" + currentQuestion.toString();
    }

    //次々回の質問がある場合、次の質問のnameを取得
    if (!nextQuestionNumber) {
        currentQuestionString2 = null;
    } else if (nextQuestionNumber < 10) {
        currentQuestionString2 = "question0" + nextQuestionNumber.toString();
    } else if (10 <= nextQuestionNumber) {
        currentQuestionString2 = "question" + nextQuestionNumber.toString();
    }

    //次回、次々回の質問が設定されている場合、それぞれ質問データを取得
    if (currentQuestionString1) {
        currentQuestionData1 = numberOfQuestions.find(item => item.name === currentQuestionString1);
    } else {
        currentQuestionData1 = null;
    }

    if (currentQuestionString2) {
        currentQuestionData2 = numberOfQuestions.find(item => item.name === currentQuestionString2);
    } else {
        currentQuestionData2 = null;
    }
}

function rewrite(imgCount) {
    //質問タイトル書き換え
    const style = document.createElement('style');
    style.innerHTML = `#modal_text::before { content: "${currentQuestionData1.title}"; }`;
    document.head.appendChild(style);
    //画像を書き換え
    setTimeout(function () {
        while (imgCount < 9) {
            imgTagsInContainer1[imgCount].src = "img/" + currentQuestionData1.name + "/0" + (imgCount + 1) + ".jpg";
            imgTagsInContainer1[imgCount].alt = "0" + (imgCount + 1);
            if (currentQuestionData2) {
                imgTagsInContainer2[imgCount].src = "img/" + currentQuestionData2.name + "/0" + (imgCount + 1) + ".jpg";
            }
            //次回スライド動作のために削除
            imgTagsInContainer1[imgCount].style.animation = null;
            imgTagsInContainer2[imgCount].style.animation = null;
            imgCount++;
        }
    }, 600)
}

/**************************************************************************************************************************************************
 *  recaptchaがマウスから避ける動作
 * 
 *  rectX, Y：ウィンドウ左上から起算したrecaptchaの配置位置（衝突検知で使用）
 *　checkBoxStyleX, Y：recaptchaのスタイルに適用する位置　recaptchaのスタイルは画面中心から起算されるので、ウィンドウ左上から起算するrectX, Yとは別で設定する必要がある
 *************************************************************************************************************************************************/

let mousemove_function = (event) => {
    //衝突検知時にrecaptchaがマウスから避ける
    if (detectCollision(event.clientX, event.clientY)) {
        //初回表示時に衝突した場合は、マウスからrecaptchaを200離れた場所(ランダム)に置く
        if (formerMouseX === undefined) {
            const formerRectX = rectX;
            const formerRectY = rectY;

            const randomAngle = Math.random() * 2 * Math.PI;
            const dx = 200 * Math.cos(randomAngle);
            const dy = 200 * Math.sin(randomAngle);


            rectX = event.clientX - dx - 143;
            rectY = event.clientY - dy - 40;

            checkBoxStyleX = rectX - formerRectX;
            checkBoxStyleY = rectY - formerRectY;
        } else {
            //現在と前回マウス位置との差分を取る
            let mouseDiffX = event.clientX - formerMouseX;
            let mouseDiffY = event.clientY - formerMouseY;

            //差分をrecaptchaと衝突基準点(rectX, rectY)に足して、マウスから同じ距離で離れるようにする
            checkBoxStyleX += mouseDiffX;
            checkBoxStyleY += mouseDiffY;

            rectX += mouseDiffX;
            rectY += mouseDiffY;
        }
        recaptcha.style.left = checkBoxStyleX + "px";
        recaptcha.style.top = checkBoxStyleY + "px";
    }

    //画面外にチェックボックスが出たときに、位置を中央に戻す
    if (isOutofBounds()) {
        initializePosition(restoreMovement);
    }

    //次回差分取得のために、今回のマウス位置を設定
    formerMouseX = event.clientX;
    formerMouseY = event.clientY;
}

/************************************
* マウスとrecaptchaの衝突検知
*
* rectX + 143, rectY + 40(衝突基準点)： recaptchaの中心点。ここから半径200以内にマウス近づいた場合衝突検知をtrueで返す。
 ***********************************/
function detectCollision(mouseX, mouseY) {
    //初回の衝突判定までは、衝突基準点を初期位置(画面中央)に設定

    if (initialPosition) {
        const clientRect = recaptcha.getBoundingClientRect();
        rectX = (clientRect.width) / 2 - 143;
        rectY = clientRect.y;
    }


    //衝突基準点とマウスの距離
    let dx = mouseX - (rectX + 143);
    let dy = mouseY - (rectY + 40);



    const distance = Math.sqrt(dx * dx + dy * dy);

    //衝突判定であれば初期位置フラグをfalse
    if (distance < 200) {
        initialPosition = false;
    }

    //200未満であれば衝突検知をtrueで返す
    return distance < 200;
}

/************************************
* 衝突基準点が画面外に出たか検知
*
 ***********************************/
function isOutofBounds() {
    const clientRect = wrapper.getBoundingClientRect();
    let wrapperWidth = clientRect.width;
    let wrapperHeight = clientRect.height;

    return rectX + 143 > wrapperWidth || rectY + 40 > wrapperHeight || 0 >= rectX + 143 || 0 >= rectY + 40;
}

/************************************
* recaptchaと衝突基準点の位置初期化（画面中央に戻す）
*
 ***********************************/
function initializePosition(restoreFlag) {

    const clientRect = wrapper.getBoundingClientRect();
    rectX = clientRect.width / 2 - 143;
    rectY = clientRect.height / 2 - 50;

    checkBoxStyleX = 0;
    checkBoxStyleY = 0;

    recaptcha.style.left = checkBoxStyleX + "px";
    recaptcha.style.top = checkBoxStyleY + "px";
    initialPosition = true;

    //チェックボックスが中央に戻る途中にマウスに反応して衝突基準点にずれが生じることを防ぐ
    wrapper.removeEventListener('mousemove', mousemove_function);
    //再度チェックボックスを動かす場合
    if (restoreFlag) {
        setTimeout(function () { container.addEventListener('mousemove', mousemove_function) }, 300);
    } else {
        //clicToEscapeで使用
        formerRecaptchaX = 0;
        formerRecaptchaY = 0;
    }
}

/**************************************************************************************************************************************************
 *  ウィンドウサイズ変更時処理
 * 
 *************************************************************************************************************************************************/
function resizeWindow() {
    //ウィンドウサイズが変わったときに衝突基準点をチェックボックスに合わせる
    const clientRect = wrapper.getBoundingClientRect();
    rectX = clientRect.width / 2 - 140 + checkBoxStyleX;
    rectY = clientRect.height / 2 - 50 + checkBoxStyleY;

    //クラッカーの位置を調整
    popperLeft.style.left = (clientRect.width / 2 - 445) + "px";
    popperRight.style.right = (clientRect.width / 2 - 445) + "px";
}

/**************************************************************************************************************************************************
 *  クリックしてrecaptchaが避ける動き
 * 
 *************************************************************************************************************************************************/

function clickToEscape() {
    //位置初期化＆マウスに反応を無効
    restoreMovement = false;
    initializePosition(restoreMovement);

    let numberOfClicks = 0;
    //モーションを変更
    recaptcha.style.transition = "left 0.2s ease, top 0.2s ease";
    recaptcha.addEventListener('click', function () {
        const clientRect = wrapper.getBoundingClientRect();
        let tooClose = true;

        //クリック3回目まではランダムにrecaptcha位置を設定
        if (numberOfClicks < 3) {

            //ランダムにrecaptcha位置を設定、前回位置と近すぎる場合は再設定
            while (tooClose) {
                checkBoxStyleX = Math.floor(Math.random() * (clientRect.width * 2 / 4) + clientRect.width * 1 / 4) - clientRect.width / 2;
                checkBoxStyleY = Math.floor(Math.random() * (clientRect.height * 2 / 4) + clientRect.height * 1 / 4) - clientRect.height / 2;
                if (tooCloseCalc(checkBoxStyleX, checkBoxStyleY)) {
                    tooClose = false;
                    formerRecaptchaX = checkBoxStyleX;
                    formerRecaptchaY = checkBoxStyleY;
                }
            }
            recaptcha.style.left = checkBoxStyleX + "px";
            recaptcha.style.top = checkBoxStyleY + "px";
            numberOfClicks++;
            //クリック4回目に中央に戻す
        } else if (numberOfClicks === 3) {
            recaptcha.style.left = 0 + "px";
            recaptcha.style.top = 0 + "px";
            numberOfClicks++;
            //クリック5回目
        } else if (numberOfClicks === 4) {
            //ウィンドウが小さくてもモーダルが見えるようにスクロールさせる
            html[0].style.overflow = "auto";
            //モーダルが開けるようになる
            checkBox.disabled = false;

        }
    });
}

/************************************
* 前回と距離が近すぎるか検知
 ***********************************/
function tooCloseCalc(x, y) {
    let defX = x - formerRecaptchaX;
    let defY = y - formerRecaptchaY;

    if (defX < 0) {
        defX = -defX;
    }
    if (defY < 0) {
        defY = -defY;
    }

    return defX > 50 && defY > 50;
}

wrapper.addEventListener('mousemove', mousemove_function), 1000;
wrapper.addEventListener('click', clickEvent);
setTimeout(clickToEscape, 15000);
window.onresize = resizeWindow;

questionNameSetting();