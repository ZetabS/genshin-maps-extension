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
// 맵 타입 변경
declare let changeMapsType: Function;
declare let drawMapsLayer: Function;

// 핀 리셋
declare const setPinDataRefresh: Function;

// 화면의 핀 요소 다시 그리기
declare const setPinObjectRefresh: Function;

declare const GM_getResourceText: Function;
declare const GM_addStyle: Function;

declare const vanillaSelectBox: any;
