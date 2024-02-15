"use strict";
// ==UserScript==
// @name         게임닷 원신 맵스 확장
// @namespace    view underground map
// @version      3.0
// @description  원신 맵스에 여러 기능을 추가하는 유저스크립트
// @author       Zetab_S, juhyeon-cha
// @match        https://genshin.gamedot.org/?mid=genshinmaps
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gamedot.org
// @homepageURL  https://github.com/ZetabS/genshin-maps-extension
// @downloadURL  https://github.com/ZetabS/genshin-maps-extension/raw/main/extension.js
// @updateURL    https://github.com/ZetabS/genshin-maps-extension/raw/main/extension.js
// @require      https://github.com/ZetabS/genshin-maps-extension/raw/main/js/select-box.js
// @resource     selectbox_css https://github.com/ZetabS/genshin-maps-extension/raw/main/css/select-box.css
// @resource     extension_css https://github.com/ZetabS/genshin-maps-extension/raw/main/css/extension.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==
let IS_VISIBLE_ACTIVE_MAPS_PIN = true;
let IS_UNDERGROUND_ACTIVE = false;
let CHEST_FILTER;
// 왼쪽 메뉴에서 보물상자 핀이 선택되었는지 업데이트하는 함수
function updateChestPinLoadedState() {
    const chestPinElement = document.querySelector('.maps-extension > .chest-pin');
    if (!chestPinElement) {
        console.log('chestPinElement does not exists');
        return;
    }
    const IS_CHEST_PIN_LOADED = MAPS_PinLoad.filter((value) => value.name?.includes('보물상자')).length > 0;
    if (IS_CHEST_PIN_LOADED) {
        chestPinElement.classList.remove('hide');
    }
    else {
        chestPinElement.classList.add('hide');
    }
    CHEST_FILTER?.setValue('all');
}
// HTML 코드로 요소를 생성하는 함수
function createElementFromHTML(innerHTML) {
    const template = document.createElement('template');
    template.innerHTML = innerHTML;
    const children = template.content.children;
    if (children.length === 1) {
        return children[0];
    }
    else {
        throw Error('children does not exists');
    }
}
// 스위치 UI를 추가하는 함수
function addMapsExtensionSwitch() {
    const mapsExtensionElement = createElementFromHTML(`
    <div class="maps-extension">
      <div class="chest-pin">
        <div class="maps-extension-switch-label">상자 필터</div>
        <select id="chest-filter" multiple>
          <option value="평범한" style="color: gray;">평범한</option>
          <option value="정교한" style="color: #9ee0d4;">정교한</option>
          <option value="진귀한" style="color: #e6ba7b;">진귀한</option>
          <option value="화려한" style="color: #ff6c38;">화려한</option>
          <option value="신묘한" style="color: #accb29;">신묘한</option>
        </select>
      </div>
      <div class="maps-extension-switch-label">활성맵 핀</div>
      <div id="visibleActiveMapsPinSwitch" class="maps-extension-switch on"></div>
      <div class="maps-extension-switch-label">지하 맵</div>
      <div id="undergroundSwitch" class="maps-extension-switch"></div>
    </div>`);
    const mapsAddonsMenuElement = document.getElementById('mapsAddonsMenu');
    mapsAddonsMenuElement.after(mapsExtensionElement);
    const undergroundSwitchElement = document.getElementById('undergroundSwitch');
    undergroundSwitchElement.addEventListener('click', () => {
        IS_UNDERGROUND_ACTIVE = !IS_UNDERGROUND_ACTIVE;
        if (IS_UNDERGROUND_ACTIVE) {
            undergroundSwitchElement.classList.add('on');
            document.querySelector('[data-target=\'지하 지도\']').click();
        }
        else {
            undergroundSwitchElement.classList.remove('on');
            document.querySelector('[data-target=\'지상 지도\']').click();
        }
        setPinObjectRefresh();
    });
    addMapChangeEventListener();
    const visibleActiveMapsPinSwitchElement = document.getElementById('visibleActiveMapsPinSwitch');
    visibleActiveMapsPinSwitchElement.addEventListener('click', () => {
        IS_VISIBLE_ACTIVE_MAPS_PIN = !IS_VISIBLE_ACTIVE_MAPS_PIN;
        if (IS_VISIBLE_ACTIVE_MAPS_PIN) {
            visibleActiveMapsPinSwitchElement.classList.add('on');
        }
        else {
            visibleActiveMapsPinSwitchElement.classList.remove('on');
        }
        setPinObjectRefresh();
        setPinDataRefresh();
    });
    CHEST_FILTER = new vanillaSelectBox('#chest-filter', {
        placeHolder: '상자 선택',
        translations: {
            'all': '전체',
            'item': 'item',
            'items': 'items',
            'selectAll': '전체 선택',
            'clearAll': '전체 취소'
        },
        disableSelectAll: false,
        keepInlineStyles: false,
        keepInlineCaretStyles: false
    });
    CHEST_FILTER.setValue('all');
    for (const li of CHEST_FILTER.ul.childNodes) {
        if (li.dataset.value !== 'all') {
            li.textContent += ' ■';
        }
    }
    const chestFilter = document.getElementById('chest-filter');
    chestFilter.addEventListener('change', () => {
        setPinObjectRefresh();
    });
}
// 상자 종류를 반환하는 함수
function getChestCategoryName(mapData) {
    const chestPinData = MAPS_PinLoad.filter((value) => value.name?.includes('보물상자'));
    for (const pinData of chestPinData) {
        if (!pinData.category) {
            continue;
        }
        for (const categoryId in pinData.category) {
            if (mapData.category === categoryId) {
                return pinData.category[categoryId].name;
            }
        }
    }
    return undefined;
}
// 핀이 '지하 및 실내 구역 입구' 인지 확인하는 함수
function isUndergroundEntrance(mapData) {
    const entrancePinData = MAPS_PinLoad.filter((value) => value.name?.includes('지하 및 실내 구역 입구'));
    return entrancePinData.some((pinData) => pinData.mapData && pinData.mapData.some((entranceMapData) => entranceMapData.id === mapData.id));
}
// MAPS_PinDraw.get 함수의 반환 값을 필터링해서 지상과 지하 상자 핀을 구별하는 함수
function filterPinDrawGet() {
    MAPS_PinDraw.get = new Proxy(MAPS_PinDraw.get, {
        apply: function (target, thisArg, argumentsList) {
            const originalResult = target.call(thisArg, argumentsList[0]);
            if (!originalResult) {
                return undefined;
            }
            const chestFilter = document.getElementById('chest-filter');
            const chestFilterValue = Array.from(chestFilter.selectedOptions).map(v => v.value);
            const chestFilteredResult = originalResult.filter((mapData) => {
                if (!mapData.category) {
                    return true;
                }
                const chestCategoryName = getChestCategoryName(mapData);
                return !chestCategoryName || chestFilterValue.includes(chestCategoryName);
            });
            if (IS_VISIBLE_ACTIVE_MAPS_PIN) {
                return chestFilteredResult.filter((mapData) => {
                    return IS_UNDERGROUND_ACTIVE === mapData.tag?.includes('지하') || isUndergroundEntrance(mapData);
                });
            }
            return chestFilteredResult;
        }
    });
}
function addMapChangeEventListener() {
    const undergroundSwitchElement = document.getElementById('undergroundSwitch');
    document.querySelector('[data-target=\'지상 지도\']').addEventListener('click', () => {
        IS_UNDERGROUND_ACTIVE = false;
        undergroundSwitchElement.classList.remove('on');
        setPinObjectRefresh();
    });
    document.querySelector('[data-target=\'지하 지도\']').addEventListener('click', () => {
        IS_UNDERGROUND_ACTIVE = true;
        undergroundSwitchElement.classList.add('on');
        setPinObjectRefresh();
    });
}
// 맵 타입을 변경할 때마다 실행되는 함수
changeMapsType = ((originChangeMapsType) => {
    'use strict';
    return (obj, mapCode = '') => {
        originChangeMapsType(obj, mapCode);
        addMapChangeEventListener();
    };
})(changeMapsType);
// 왼쪽 메뉴에서 핀을 제거할 때마다 실행되는 함수
removePin = ((originRemovePin) => {
    'use strict';
    /*
    MAPS_PinLoad를 프록시 상태로 변경해야 함.
    MAPS_PinLoad를 웹사이트 어디선가 지속적으로 재할당하는 것으로 추정중.
    프록시의 역할은 단순히 수정 시 updateChestPinLoadedState를 실행하는 것.
    */
    function _makePinLoadProxy() {
        const target = MAPS_PinLoad.slice();
        MAPS_PinLoad = new Proxy(target, {
            set: (target, property, value, receiver) => {
                updateChestPinLoadedState();
                return Reflect.set(target, property, value, receiver);
            }
        });
    }
    _makePinLoadProxy(); // 유저스크립트 로드 시
    return (boolGroup, pinIndex, boolTabUpdate) => {
        originRemovePin(boolGroup, pinIndex, boolTabUpdate);
        updateChestPinLoadedState();
        _makePinLoadProxy();
    };
})(removePin);
// Main
(function () {
    const selectbox_css = GM_getResourceText('selectbox_css');
    GM_addStyle(selectbox_css);
    const extension_css = GM_getResourceText('extension_css');
    GM_addStyle(extension_css);
    addMapsExtensionSwitch();
    updateChestPinLoadedState();
    filterPinDrawGet();
}());
