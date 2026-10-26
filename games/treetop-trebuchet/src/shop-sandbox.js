import {newProgress} from './build-progress.js?v=71';
import {visitShop,purchaseOffer,rerollShop,openPack,choosePack} from './build-shop.js?v=71';

// A separate, disposable shop ledger. Creative purchases exercise the same
// stock, voucher and parcel rules without touching the Adventure save.
const funded = state => ({...state,bells:1_000_000_000});
export function createSandboxShop(seed) { return visitShop(funded(newProgress()),seed); }
export function sandboxTransaction(state,action,offer) {
 const current=funded(state);
 if(action==='reroll')return rerollShop(current);
 if(action==='openPack')return openPack(current);
 if(action==='choosePack')return choosePack(current,offer.id);
 if(action==='purchase'){
  const key=offer.kind==='animal'?'animals':offer.kind==='voucher'?'vouchers':'owned';
  if(current[key].includes(offer.id))return current;
  return purchaseOffer(current,offer);
 }
 throw Error('Unknown creative shop action.');
}
