/** A single pointer (or Space) owns the gesture. Interruptions cancel, never fire. */
export function createHoldControl({canStart,onStart,onRelease,onCancel}) {
  let owner=null;
  return {
    get active(){return owner!==null;},
    begin(id){if(owner!==null||!canStart())return false;owner=id;onStart();return true;},
    end(id){if(owner!==id)return false;owner=null;onRelease();return true;},
    cancel(id){if(owner===null||(id!==undefined&&owner!==id))return false;owner=null;onCancel();return true;},
  };
}
