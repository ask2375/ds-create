//~~~ live2d-character

(() => {
  //===
  const init = (stage) => {
    const canvas = stage.querySelector('canvas');
    const modelUrl = stage.dataset.model;
    if (!canvas || !modelUrl || !window.PIXI || !PIXI.live2d) {
      console.error('[live2d-character] canvas / data-model / 依存ライブラリのいずれかが見つかりません');
      return;
    }
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const app = new PIXI.Application({ view: canvas, resizeTo: stage, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(2, devicePixelRatio || 1) });
    app.ticker.stop();
    let model = null, visible = true, paused = false;

    //---
    const fit = () => {
      if (!model) return;
      const w = app.renderer.width / app.renderer.resolution, h = app.renderer.height / app.renderer.resolution;
      const s = Math.min(w / model.internalModel.originalWidth, h / model.internalModel.originalHeight);
      model.scale.set(s); model.anchor.set(0.5, 0.5); model.position.set(w / 2, h / 2);
    };

    //---
    const sync = () => {
      const run = model && visible && !paused && !document.hidden && !reduced.matches;
      if (run) app.ticker.start(); else app.ticker.stop();
      if (model && !run) { model.update(16); app.render(); }
    };

    let t = 0, blinkAt = 2.3, talkAt = 3.0, talkEnd = 0, mouthOpen = 0, shirt = 0, shirtV = 0;
    PIXI.live2d.Live2DModel.from(modelUrl, { autoInteract: false }).then((m) => {
      model = m; model.autoUpdate = false; app.stage.addChild(model); fit();
      app.ticker.add(() => model.update(Math.min(app.ticker.deltaMS, 100)));
      const core = model.internalModel.coreModel;
      model.internalModel.eyeBlink = undefined;
      model.internalModel.breath = undefined;
      model.internalModel.on('beforeModelUpdate', () => {
        const dt = Math.min(app.ticker.deltaMS, 100) / 1000; t += dt;
        for (const id of ['ParamAngleX', 'ParamAngleY', 'ParamAngleZ', 'ParamBodyAngleX', 'ParamLegSwing']) core.setParameterValueById(id, 0);
        const bodyZ = core.getParameterValueById('ParamBodyAngleZ');
        shirtV += ((bodyZ * 1.2 - shirt) * 38 - shirtV * 7) * dt;
        shirt += shirtV * dt;
        core.setParameterValueById('ParamShirtSway', Math.max(-10, Math.min(10, shirt)));
        const u = t - blinkAt; const closed = (u >= 0 && u < 0.18) ? 1 : 0;
        if (u >= 0.18) blinkAt = t + 3.5 + Math.random() * 2.8;
        core.setPartOpacityById('eye_L_closed', closed); core.setPartOpacityById('eye_R_closed', closed);
        if (t >= talkAt) { talkEnd = t + 1.2 + Math.random(); talkAt = talkEnd + 7 + Math.random() * 5; }
        const syl = t < talkEnd ? Math.max(0, Math.sin(t * 15.7) * 0.7 + Math.sin(t * 9.3 + 1.1) * 0.5) : 0;
        mouthOpen += (Math.min(1, syl) - mouthOpen) * (1 - Math.exp(-18 * dt));
        core.setPartOpacityById('mouth_closed', 1 - mouthOpen);
      });
      sync();
    }).catch((e) => console.error('[live2d-character] モデルの読み込みに失敗しました', modelUrl, e));

    //---
    new ResizeObserver(() => { fit(); if (!app.ticker.started) app.render(); }).observe(stage);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }).observe(stage);
    document.addEventListener('visibilitychange', sync);
    reduced.addEventListener('change', sync);
    document.querySelectorAll(`[data-live2d-toggle="${stage.id}"]`).forEach((btn) => {
      btn.addEventListener('click', () => { paused = !paused; btn.setAttribute('aria-pressed', String(paused)); sync(); });
    });
  };

  //===
  const start = () => document.querySelectorAll('[data-live2d-character]').forEach(init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
