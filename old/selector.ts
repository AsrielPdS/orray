import { g } from "galho/s";
import { Group} from "./group";
import { getTag, itemIndex, L, ontag, setTag, Tag } from "./orray";
    

interface ISelector {
  /**pivot tag */
  tag: string;
  /**selected list*/
  groupKey?: string;
}
export const enum SelectionTp {
  set = 0,
  add = 1,
  range = 2,
  addRange = add | range
}
const clamp = (value: number, min: number, max: number) => value < min ? min : value >= max ? max - 1 : value;
export function pivot(l: L, tag: string) {
  let t = getTag(l,tag);
  return t ? t.index : 0;
}
export function add<T, A = T>(l: L<T, A>, key: string, value: T | number|string, tp: SelectionTp) {
  let g = l.g[key];
  let
    tag = getTag(l,key),
    o = tag ? tag.index : -1,
    n = itemIndex(l,value);

  if (o != n) {
    //setTag(l,group, value);
    setTag(l,key, value);
    if (g)
      switch (tp) {
        case SelectionTp.set:
          g.set([l[n]]);
          break;
        case SelectionTp.add:
          g.push(l[n]);
          break;
        case SelectionTp.range:
          if (o > n) {
            let t = o;
            o = n;
            n = t
          }
          g.setRange(o, n);
        case SelectionTp.addRange:
          if (o > n) {
            let t = o;
            o = n;
            n = t
          }
          g.pushRange(o, n);
          break;
      }
  }
  return l;
}
/**select all elements */
export function addAll<T, A = T>(l: L<T, A>, tag: string) {
  if (l.length) {
    if (!getTag(l,tag))
      setTag(l,tag, l[0]);

      l.g[tag]&&l.g[tag].pushAll();
  }
  return l;
}
/** remove focus */
export function clear<T, A = T>(l: L<T, A>, tag: string) {
  setTag(l,tag);
  l.g[tag]&&l.g[tag].clear();
  return l;
}

export function onchange<T, A = T>(l: L<T, A>, tag: string, listener?: (this: L<T, A>, active: T, selected?: Group<T>) => void) {
  let g = l.g[tag];
  g ? g.on(() => {
    let t = getTag(l,tag);
    listener.call(l, t && t.value, g)
  }) : ontag(l,tag, listener);
  return l;
}
/**select type */
export const tp = (control: boolean, shift: boolean) =>
  control ?
    shift ?
      SelectionTp.addRange :
      SelectionTp.add :
    shift ?
      SelectionTp.range :
      SelectionTp.set;

export function move(l: L, tag: string, distance: number, tp: SelectionTp) {
  return add(l, tag, l[clamp(pivot(l, tag) + distance, 0, l.length)], tp);
}
export function movePivot(l: L, tag: string, distance: number, revert?: boolean) {
  let ll = l.length;
  if (ll) {
    let i = pivot(l, tag) + distance;
    setTag(l,tag, l[revert ?
      i < 0 ? ll - 1 : i >= ll ? 0 : i :
      clamp(i, 0, l.length)]);
  }
  return l;
}

export function list<T, A = T>(l: L<T, A>, key: string) {
  let tag: Tag<T>, g = l.g[key];
  return g ? g.slice() : ((tag = getTag(l,key)) ? [tag.value] : []);
}
  //export class Selector<T, A = T> implements ISelector {
  //  tag: string;
  //  groupKey: string;
  //  g: Group<T>;
  //  //get 
  //  constructor(public l: L<T, A>, i: ISelector | string) {
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