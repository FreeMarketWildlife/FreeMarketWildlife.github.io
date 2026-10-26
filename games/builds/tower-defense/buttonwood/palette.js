// Buttonwood Phase 1: every sprite is authored in native world pixels.
(function () {
  'use strict';
  const A = window.ButtonwoodArt = window.ButtonwoodArt || {};
  A.palette = Object.freeze({
    blood: '#b52e43', bloodShade: '#711c35', bloodLight: '#e34b53',
    ink: '#49313f', outline: '#67434a', buriedShade: '#0b0709',
    cream: '#f7e8c4', creamShade: '#d8c397', creamLight: '#fff3d6',
    mint: '#8fb69a', mintLight: '#b9d1ab', mintShade: '#597d70',
    coral: '#d97d68', coralLight: '#f0a17c', coralShade: '#ad5955',
    wood: '#9c684d', woodLight: '#c28d60', woodShade: '#704939',
    gold: '#e6b76c', goldShade: '#b58250',
    skin: '#e8b28c', skinLight: '#f7cda2', skinShade: '#bb7c67',
    darkSkin: '#ad735e', darkSkinLight: '#d29473', darkSkinShade: '#805246',
    hair: '#74473c', hairLight: '#a06948',
    stone: '#9b9b91', stoneLight: '#c7c3aa', stoneShade: '#737e78',
    dirt: '#785242', dirtLight: '#94694d', dirtShade: '#5e4236', soilRoot: '#b08b62',
    grass: '#6d9d58', grassLight: '#a5c975', grassShade: '#426f49',
    water: '#5eaaa6', waterLight: '#a5d9c6', waterShade: '#397e89',
    lava: '#dd7958', lavaLight: '#f5c77f', lavaShade: '#a95248',
    deep: '#675f72', deepLight: '#8b8290', deepShade: '#4f4d60',
    sky: '#c6dcd1', horizon: '#dce5cd', hill: '#b0cbb7', nearHill: '#9ebca2',
    cave: '#67564f', nightCave: '#403b50', nightSky: '#384454',
    nightHorizon: '#495364', nightCloud: '#64717a', nightHill: '#52616b', nightNearHill: '#46565b'
  });
  A.timing = Object.freeze({walk: 110, work: 90});
  A.frameFor = function (state, elapsed) {
    if (state === 'idle') {
      const phase = ((elapsed % 4200) + 4200) % 4200;
      return phase < 3900 ? Math.floor(phase / 1300) : phase < 4010 ? 3 : 0;
    }
    return Math.floor(elapsed / A.timing[state]) % A.workerFrames[state];
  };
})();
