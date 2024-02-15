interface MapData {
  id: string;
  content: string;
  image: string;
  state: boolean;
  x: number;
  y: number;
  tag: string[];
  line: boolean;
  category?: string;
  index?: number;
  pin: number;
  point: number;
}

interface PinData {
  id?: string;
  name?: string;
  category: {
    [key: string]: {
      name: string;
      content: string;
      color: string;
    };
  } | null;
  colorValue: string;
  iconValue: string;
  sizeValue: number;
  opacityValue: number;
  lineValue: boolean;
  timer: boolean;
  offcombine: boolean;
  exception: boolean;
  maps: string;
  mapData: MapData[];
  version: number;
  origin: string;
  server: string;
  label?: string;
  group: number;
  index: number;
  draw: any; // Define the appropriate type for this property
}

interface Observable {
  [p: symbol]: Array<any>;

  subscribe: (handler: Function) => void;
}

type ObservablePinDataArray = PinData[] & Observable;

// 지도 및 핀 그리기
declare let drawMapsLayer: Function;
// 핀 데이터 불러온 것 한개 추가해주기 (핀 데이터, 핀 정보 / 넣을 시 그룹화 사용, 포커스 유무)
declare let addPinData: Function;
// 핀 제거하기
declare let removePin: Function;
declare let removeAllPin: Function;
// 화면의 핀 요소 다시 그리기
declare const setPinObjectRefresh: Function;
// 포인트 그리기
declare const drawPinObject: Function;
declare const GM_getResourceText: Function;
declare const GM_addStyle: Function;

declare const vanillaSelectBox: any;
declare const objectViewer: HTMLElement;

// 왼쪽 메뉴에서 로드된 핀 분류
declare let MAPS_PinLoad: ObservablePinDataArray;
// 맵에 보이고 있는 영역
declare let MAPS_ViewPin: Set<string>;
declare const MAPS_Scale: number;
declare const MAPS_RelativeX: number;
declare const MAPS_RelativeY: number;
declare const MAPS_Block: number;
declare const MAPS_ViewSize: number;
declare const MAPS_Size: number;
declare let MAPS_PinDraw: Map<string, Array<MapData>>;
declare const MAPS_State: {
  pinGroup: boolean,
  doubleTouch: boolean,
  fadeEffect: boolean,
  focusPoint: undefined,
  mapsText: boolean,
  iframe: boolean,
  shortcut: object,
  orientation: string
};

// 지도 및 핀 그리기
function drawMapsLayer2(boolPanelHide) {
  // 현재 그려야하는 지도 경로
  const strMapsPath = '/file/maps/' + MAPS_Type + '/' + MAPS_Target + '/';

  // 출력 범위 계산
  var scrollX = objectViewer.scrollLeft;
  var scrollY = objectViewer.scrollTop;

  var nowView = objectViewer.getClientRects()[0];
  var maxWidth = scrollX + nowView.width;
  var maxHeight = scrollY + nowView.height;

  // 뷰 사이즈 초과 시 최대 뷰사이즈로 입력.
  maxWidth = maxWidth > MAPS_ViewSize ? MAPS_ViewSize : maxWidth;
  maxHeight = maxHeight > MAPS_ViewSize ? MAPS_ViewSize : maxHeight;

  // 시작점
  var intStartX = Math.floor(scrollX / MAPS_ViewBlock);
  var intStartY = Math.floor(scrollY / MAPS_ViewBlock);

  // 종료 지점
  var intEndX = Math.floor(maxWidth / MAPS_ViewBlock);
  var intEndY = Math.floor(maxHeight / MAPS_ViewBlock);

  // 그려야할 항목 배열으로 작성
  var nowViewBase = new Set(); // 그려야할 배경
  for (var x = intStartX; x <= intEndX; x++) {
    for (var y = intStartY; y <= intEndY; y++) {
      nowViewBase.add(x + '/' + y);
    }
  }

  // 지도 새로 추가된 것 체크
  let objectFragment = document.createDocumentFragment();
  let tempBlockSize = MAPS_ViewBlock + 1; //격자 버그 제거용.
  nowViewBase.forEach(function(v) {
    var mapsViewIndex = MAPS_ViewBase.has(v);
    if (mapsViewIndex == true) {
      MAPS_ViewBase.delete(v);
      return true;
    }

    var arrData = v.split('/', 2);
    var objectImage = document.createElement('img');
    objectImage.setAttribute('data-x', arrData[0]);
    objectImage.setAttribute('data-y', arrData[1]);

    objectImage.setAttribute(
      'src',
      strMapsPath + 'genshin_' + MAPS_ImageSize + '_' + arrData[0] + '_' + arrData[1] + '.jpeg'
    );
    objectImage.setAttribute(
      'style',
      'width: ' +
      tempBlockSize +
      'px; height: ' +
      tempBlockSize +
      'px; transform: translate(' +
      arrData[0] * MAPS_ViewBlock +
      'px, ' +
      arrData[1] * MAPS_ViewBlock +
      'px);'
    );

    if (MAPS_State.fadeEffect === true) {
      objectImage.className = 'fade';
      objectImage.style.opacity = 0;
    }

    objectFragment.appendChild(objectImage);
  });

  objectLayerBase.appendChild(objectFragment);

  // 화면에 노출되지 않는 항목 제거
  MAPS_ViewBase.forEach(function(v) {
    let arrData = v.split('/', 2);
    objectLayerBase.querySelector('img[data-x="' + arrData[0] + '"][data-y="' + arrData[1] + '"]').remove();
  });

  MAPS_ViewBase = nowViewBase;

  // 핀 그리기
  var maxWidth = scrollX + nowView.width;
  var maxHeight = scrollY + nowView.height;

  // 뷰 사이즈 초과 시 최대 뷰사이즈로 입력.
  /*
    maxOriginWidth = maxWidth > MAPS_ViewSize ? MAPS_ViewSize : maxWidth;
    maxOriginHeight = maxHeight > MAPS_ViewSize ? MAPS_ViewSize : maxHeight;*/

  var arrPinStart = getBlock(replaceOrigin(scrollX) - MAPS_RelativeX, replaceOrigin(scrollY) - MAPS_RelativeY);
  var intPinStartX = arrPinStart.x;
  var intPinStartY = arrPinStart.y;

  var arrPinEnd = getBlock(replaceOrigin(maxWidth) - MAPS_RelativeX, replaceOrigin(maxHeight) - MAPS_RelativeY);
  var intPinEndX = arrPinEnd.x;
  var intPinEndY = arrPinEnd.y;

  var nowViewPin = new Set(); // 그려야할 핀
  for (var x = intPinStartX; x <= intPinEndX; x++) {
    for (var y = intPinStartY; y <= intPinEndY; y++) {
      nowViewPin.add(x + '/' + y);
    }
  }

  // 그려줘야할 핀 그리기
  let objectPinFragment = document.createDocumentFragment();
  nowViewPin.forEach(function(v) {
    if (MAPS_ViewPin.has(v)) {
      MAPS_ViewPin.delete(v);
      return true;
    }

    var arrData = v.split('/', 2);
    var arrDrawPin = MAPS_PinDraw.get(v);
    arrDrawPin = arrDrawPin ? arrDrawPin : [];

    mapPinGroup = new Map();
    arrDrawPin.forEach(function(point) {
      if (MAPS_State.pinGroup == true && MAPS_PinLoad[point.pin].offcombine == false) {
        // 핀 그룹화를 위해 평균 구하기.
        let arrPinGroup = mapPinGroup.get(point.pin);
        arrPinGroup = arrPinGroup ? arrPinGroup : { x: 0, y: 0, state: 0, length: 0, point: point };
        arrPinGroup.x += point.x;
        arrPinGroup.y += point.y;
        arrPinGroup.length++;
        arrPinGroup.state = point.state ? arrPinGroup.state + 1 : arrPinGroup.state;

        mapPinGroup.set(point.pin, arrPinGroup);
        return false;
      }

      let objectPoint = drawPinObject(false, point, arrData);
      objectPinFragment.appendChild(objectPoint);
    });

    if (MAPS_State.pinGroup == true) {
      mapPinGroup.forEach(function(value) {
        // 핀 갯수가 1개 이상일 시 그룹화
        let objectPoint;
        if (value.length > 1) {
          objectPoint = drawPinObject(true, value.point, arrData);
          objectPoint.className = 'maps-point group';

          let objectCount = document.createElement('p');
          objectCount.innerText = value.state + '/' + value.length;
          objectPoint.querySelector('div').appendChild(objectCount);
          let groupX = value.x / value.length;
          let groupY = value.y / value.length;

          objectPoint.setAttribute(
            'style',
            'transform: translate(' + (groupX + MAPS_RelativeX) + 'px, ' + (groupY + MAPS_RelativeY) + 'px);'
          );
          objectPoint.setAttribute('data-state', value.state == value.length ? 'true' : 'false');
          objectPoint.removeAttribute('data-tip');

          // 사이즈 설정
          objectPoint.style.marginLeft = objectPoint.style.marginTop = '-64px';
        } else {
          objectPoint = drawPinObject(false, value.point, arrData);
        }

        objectPinFragment.appendChild(objectPoint);
      });
    }
  });

  objectLayerPin.appendChild(objectPinFragment);

  // 화면에 노출되지 않는 항목 제거
  MAPS_ViewPin.forEach(function(v) {
    var arrData = v.split('/', 2);
    objectLayerPin
      .querySelectorAll('.maps-point[data-x="' + arrData[0] + '"][data-y="' + arrData[1] + '"]')
      .forEach(function(o) {
        o.remove();
      });
  });

  MAPS_ViewPin = nowViewPin;

  // 페이드 효과
  setTimeout(function() {
    objectLayerBase.querySelectorAll('img.fade').forEach(function(o) {
      o.style.opacity = 1;
      o.removeAttribute('class');
    });

    MAPS_State.fadeEffect = true;
  }, 0);

  if (boolPanelHide !== false) {
    hidePanelObject();
  }
}

// 핀 데이터 불러온 것 한개 추가해주기 (핀 데이터, 핀 정보 / 넣을 시 그룹화 사용, 포커스 유무)
function addPinData2(arrPin, arrSource, boolFocus) {
  const isExist = Object.values(MAPS_PinGroup.source).some(
    ({ type, primary }) => type == arrSource.type && arrSource.primary === primary
  );

  if (isExist) {
    alert(
      `${arrSource.name}는(은) 이미 추가된 위치입니다.\n위치 해제는 상단의 위치 관리/숨김에서 해제할 수 있습니다.\n\n이 메시지가 지속적으로 출력될 시 위치 관리/숨김에서 일괄 해제를 눌러주세요.`
    );
    return false;
  }

  if (Array.isArray(arrPin) == false) {
    // 핀을 오브젝트로 한개만 보냇을 시 배열로 치환
    arrPin = [arrPin];
  }

  boolFocus = typeof boolFocus == "boolean" ? boolFocus : true;

  // 그룹 기능 사용 유무 체크.
  let boolGroup = arrSource != false ? true : false;
  let arrInputID = [];
  let intGroupIndex = boolGroup == true ? MAPS_PinGroup.index : false;

  if (boolGroup == true) {
    MAPS_PinGroup.index++;
    MAPS_PinGroup.source[intGroupIndex] = arrSource;
  }

  let arrFocus = false;
  let strFocusPoint = getParameterByName("point");
  arrPin.forEach((value) => {
    // 핀 데이터 버전 체크
    value = value.version != 2 ? replaceDataUpdate(value) : value;
    boolGroup == true ? (value.group = intGroupIndex) : false;

    arrInputID.push(value.server);
    let intInputIndex = MAPS_PinLoad.push(value);
    value.index = intInputIndex - 1;

    // 위치 포커스 기능
    if (arrFocus == false && strFocusPoint) {
      // 특정 위치 검색 기능
      value.mapData.forEach((point) => {
        if (point.id != strFocusPoint) return true;

        // 위치 찾을 시 URL 변경 처리
        arrFocus = { x: point.x, y: point.y };
        let strURL = location.search.replace("&point=" + point.id, "");
        history.pushState("", "", strURL);
        point.highlight = true;
        return false;
      });
    } else if (arrFocus == false && value.mapData[0] && !strFocusPoint && boolFocus == true) {
      // 첫번째 핀 인덱스
      arrFocus = { x: value.mapData[0].x, y: value.mapData[0].y };
    }
  });

  boolGroup == true ? (MAPS_PinGroup[intGroupIndex] = arrInputID) : false;
  if (arrFocus !== false) {
    // 첫번째 위치 포커스 기능
    setFocusPoint(arrFocus.x, arrFocus.y);
  }

  // 첫번째 핀 종류에 따라 지도 전환
  if (arrPin[0] && arrPin[0].maps != MAPS_Type) {
    changeMapsType({ strCode: arrPin[0].maps }, arrPin[0].maps);
  }

  setPinDataRefresh();
  addPanelPinList(intGroupIndex, arrPin, arrSource); // 패널 리스트 추가

  return intGroupIndex;
}

// 핀 제거하기
function removePin2(boolGroup, pinIndex, boolTabUpdate) {
  boolTabUpdate = typeof boolTabUpdate == 'boolean' ? boolTabUpdate : true;

  var arrPinIndex;
  if (boolGroup == false && Array.isArray(pinIndex) == false) {
    // 핀을 숫자값으로 보냇을 시 배열로 치환
    arrPinIndex = [pinIndex];
  } else if (boolGroup == true) {
    arrPinIndex = MAPS_PinGroup[pinIndex];

    if (!pinIndex) {
      console.log('해당 핀 그룹을 찾을 수 없습니다.');
      return false;
    }

    // 유저 리스트 제거
  }

  if (boolGroup == true) {
    // 그룹으로 전송했을 시 아이디로 제거
    MAPS_PinLoad.forEach((v, i) => {
      // 그룹 아이디가 다르거나, 아이디가 다를 시 제거 안함.
      if (v.group != pinIndex || arrPinIndex.indexOf(v.server) === -1) {
        return true;
      }

      delete MAPS_PinLoad[i];
    });
    MAPS_PinLoad = MAPS_PinLoad.filter(Object);
    delete MAPS_PinGroup[pinIndex];
    delete MAPS_PinGroup.source[pinIndex];

    if (boolTabUpdate === true) {
      setTabDataUpdate(); // 탭 데이터도 업데이트 처리
    }
  } else {
    // 해당하는 핀 인덱스 제거
    arrPinIndex.forEach((value) => {
      MAPS_PinLoad.splice(value, 1);
    });
  }

  setPinDataRefresh();
  if (boolGroup == false) {
    return true;
  }

  // -- 핀 리스트 제거 처리 파트

  // 추천 리스트 해제
  const objectRecommand = objectPanelWindow.querySelector('.maps-content-pin[data-group="' + pinIndex + '"]');
  if (objectRecommand) {
    const objectCount = objectRecommand.querySelector('.text > .count');
    objectRecommand.classList.remove('focus');
    objectCount.innerText = objectCount.getAttribute('data-count') + '개 위치';
  }

  // 나의 리스트 해제
  const objectDetail = objectPanelWindow.querySelector('.maps-pin-setting[data-group="' + pinIndex + '"]');
  if (objectDetail) {
    objectDetail.remove();
  }

  return true;
}

// 화면의 핀 요소 다시 그리기
function setPinObjectRefresh2() {
  MAPS_ViewPin = new Set();
  objectLayerPin.querySelectorAll('.maps-point').forEach(function(o) {
    o.remove();
  });

  drawMapsLayer();
}

// 포인트 그리기
function drawPinObject2(boolGroup, arrPoint, arrPosition) {
  let arrPinData = MAPS_PinLoad[arrPoint.pin];
  let objectPoint;

  if (arrPinData.draw) {
    objectPoint = arrPinData.draw.cloneNode(true);
  } else {
    // 첫번째 핀 그리기일 시
    objectPoint = document.createElement('div');
    objectPoint.className = 'maps-point';

    // 사이즈 설정
    objectPoint.style.width = objectPoint.style.height = arrPinData.sizeValue + 'px';
    objectPoint.style.marginLeft = objectPoint.style.marginTop = -(arrPinData.sizeValue / 2) + 'px';

    let objectImage = document.createElement('div');

    // 배경 설정
    let arrColor = getRGB(arrPinData.colorValue);
    objectImage.style.backgroundColor = 'rgba(' + arrColor.join(',') + ',' + arrPinData.opacityValue / 10 + ')';
    objectPoint.appendChild(objectImage);

    // 라인 밸류
    if (arrPinData.lineValue == true) {
      objectPoint.style.zIndex = 0;
    }

    // 아이콘 설정
    if (arrPinData.iconValue == '/module/genshinmaps/asset/image/icon-numbering.png') {
      // 숫자 입력 핀일 시
      objectPoint.classList.add('numbering');
      objectImage.style.padding = (arrPinData.sizeValue - 24) / 2 + 'px 0';
    } else if (arrPinData.iconValue == '/module/genshinmaps/asset/image/icon-text.png') {
      // 텍스트 입력 핀일 시
      objectPoint.classList.add('text');
      objectImage.style.fontSize = arrPinData.sizeValue / 2 + 'px';

      objectPoint.style.width = objectPoint.style.height = 'auto';
      objectPoint.style.marginLeft = objectPoint.style.marginTop = '0';

      if (arrPinData.opacityValue == 1) {
        objectImage.style.backgroundColor = '';
      }
    } else {
      objectImage.style.backgroundImage = 'url(' + arrPinData.iconValue + ')';
    }

    arrPinData.draw = objectPoint;
    objectPoint = objectPoint.cloneNode(true);
  }

  objectPoint.setAttribute('data-x', arrPosition[0]);
  objectPoint.setAttribute('data-y', arrPosition[1]);
  objectPoint.setAttribute('data-state', arrPoint.state);

  objectPoint.setAttribute('data-pin', arrPoint.pin);
  objectPoint.setAttribute('data-point', arrPoint.point);

  if (arrPoint.tag?.includes('지하') === true) {
    objectPoint.dataset.strata = 'underground';
  }

  // 그룹화 시 계산 안함.
  if (boolGroup == false) {
    objectPoint.style.transform =
      'translate(' +
      (arrPoint.x + MAPS_RelativeX) +
      'px, ' +
      (arrPoint.y + MAPS_RelativeY) +
      'px) scale(' +
      MAPS_PointScale +
      ')';
    // 해당 위치에 분류가 지정되어있을 시
    if (arrPoint.category && arrPinData.category[arrPoint.category]) {
      let arrCategory = arrPinData.category[arrPoint.category];
      objectPoint.querySelector('div').style.borderColor = arrCategory.color;
      objectPoint.setAttribute('data-tip', arrPinData.name + '#' + (arrPoint.point + 1) + ' - ' + arrCategory.name);
    } else {
      objectPoint.setAttribute('data-tip', arrPinData.name + '#' + (arrPoint.point + 1));
    }

    if (arrPoint.highlight === true) {
      objectPoint.classList.add('highlight');
    }

    if (objectPoint.className != 'maps-point') {
      if (objectPoint.classList.contains('numbering')) {
        objectPoint.querySelector('div').innerText = arrPoint.point + 1;
      } else if (objectPoint.classList.contains('text')) {
        objectPoint.querySelector('div').innerText = arrPoint.content ? arrPoint.content : '텍스트 입력';
        objectPoint.style.transform =
          'translate(' + (arrPoint.x + MAPS_RelativeX) + 'px , ' + (arrPoint.y + MAPS_RelativeY) + 'px)';
      }
    }
  }

  return objectPoint;
}