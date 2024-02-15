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

// 왼쪽 메뉴에서 로드된 핀 분류
declare let MAPS_PinLoad: PinData[];
// 실제로 표시되는 핀들
declare let MAPS_PinDraw: Map<string, Array<MapData>>;

// 핀 제거하기
declare let removePin: Function;
// 화면의 핀 요소 다시 그리기
declare const setPinObjectRefresh: Function;
declare const GM_getResourceText: Function;
declare const GM_addStyle: Function;

declare const vanillaSelectBox: any;

// 핀 제거하기
function originRemovePin(boolGroup, pinIndex, boolTabUpdate) {
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