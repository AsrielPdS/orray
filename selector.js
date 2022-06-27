const { getTag, ontag, setTag } = require("./orray");

const clamp = (value, min, max) => value < min ? min : value >= max ? max - 1 : value;
exports.pivot = (l, tag) => {
  let t = getTag(l, tag);
  return t ? t.index : 0;
}
exports.add = (l, key, value, tp) => {
  let g = l.g[key];
  let tag = getTag(l, key), o = tag ? tag.index : -1, n = l.findIndex(value);
  if (o != n) {
    //setTag(l,group, value);
    setTag(l, key, value);
    if (g)
      switch (tp) {
        case 0 /* set */:
          g.set([l[n]]);
          break;
        case 1 /* add */:
          g.push(l[n]);
          break;
        case 2 /* range */:
          if (o > n) {
            let t = o;
            o = n;
            n = t;
          }
          g.setRange(o, n);
        case 3 /* addRange */:
          if (o > n) {
            let t = o;
            o = n;
            n = t;
          }
          g.pushRange(o, n);
          break;
      }
  }
  return l;
}
/**select all elements */
exports.addAll = (l, tag) => {
  if (l.length) {
    if (!getTag(l, tag))
      setTag(l, tag, l[0]);
    l.g[tag] && l.g[tag].pushAll();
  }
  return l;
}
/** remove focus */
exports.clear = (l, tag) => {
  setTag(l, tag);
  l.g[tag] && l.g[tag].clear();
  return l;
}
exports.onchange = (l, tag, listener) => {
  let g = l.g[tag];
  g ? g.on(() => {
    let t = getTag(l, tag);
    listener.call(l, t && t.value, g);
  }) : ontag(l, tag, listener);
  return l;
}
/**select type */
exports.tp = (control, shift) => control ?
  shift ?
    3 /* addRange */ :
    1 /* add */ :
  shift ?
    2 /* range */ :
    0 /* set */;
exports.move = (l, tag, distance, tp) => {
  return add(l, tag, l[clamp(pivot(l, tag) + distance, 0, l.length)], tp);
}
exports.movePivot = (l, tag, distance, revert) => {
  let ll = l.length;
  if (ll) {
    let i = pivot(l, tag) + distance;
    setTag(l, tag, l[revert ?
      i < 0 ? ll - 1 : i >= ll ? 0 : i :
      clamp(i, 0, l.length)]);
  }
  return l;
}
exports.list = (l, key) => {
  let tag, g = l.g[key];
  return g ? g.slice() : ((tag = getTag(l, key)) ? [tag.value] : []);
}
//export class Selector<T, A = T> implements ISelector {
//  tag;
//  groupKey;
//  g: Group<T>;
//  //get
//  constructor(public l<T, A>, i: ISelector | string) {
//    if (isS(i)) i = { tag: i };
//    this.tag = i.tag;
//    this.g = l.g[this.groupKey = i.groupKey || i.tag];
//  }
//  // home(tp: SelectTp) {
//  //   let l = this.l;
//  //   l.length && this.add(l[0], tp);
//  //   return this;
//  // }
//  // end(tp: SelectTp) {
//  //   let l = this.l;
//  //   l.length && this.add(l[l.length - 1], tp);
//  //   return this;
//  // }
//  }
//  // pivotHome() { return this.movePivot(-this.index); }
//  // pivotEnd() { return this.movePivot(this.l.length-this.index); }
//  /**get list of selected items */
//  hasFocus(value: T) {
//    let { groupKey, l, g } = this, tag: Tag<T>;
//    return g ?
//      indexOf(g,value) != -1 :
//      !!(tag = getTag(l,groupKey)) && tag.value == value;
//  }
//}
