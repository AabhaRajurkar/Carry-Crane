/**
 * ColumnMethod: Synchronized Written Column Arithmetic Display
 *
 * Visually stacks numbers in H-T-U columns with animated carry badges and borrow slash-outs
 * that pop precisely in sync with the Crane animations.
 */

export class ColumnMethodView {
  constructor(containerElement) {
    this.container = containerElement;
    this.problem = null;
    this.currentValues = { hundreds: 0, tens: 0, units: 0 };
    this.carries = { tens: 0, hundreds: 0 };
    this.borrows = { tens: null, units: null, hundreds: null };

    this.render();
  }

  setProblem(problem) {
    this.problem = problem;
    this.carries = { tens: 0, hundreds: 0 };
    this.borrows = { tens: null, units: null, hundreds: null };
    this.render();
  }

  updateLiveDigits(values) {
    this.currentValues = { ...values };
    const curU = document.getElementById('cm-cur-u');
    const curT = document.getElementById('cm-cur-t');
    const curH = document.getElementById('cm-cur-h');

    if (curU) curU.textContent = values.units !== undefined ? values.units : '0';
    if (curT) curT.textContent = values.tens !== undefined ? values.tens : '0';
    if (curH) curH.textContent = values.hundreds !== undefined ? values.hundreds : '0';
  }

  /**
   * Activates carry mark (small "1") above the target column in sync with crane animation.
   * @param {'tens'|'hundreds'} column
   */
  showCarryMark(column) {
    this.carries[column] = 1;
    const el = document.getElementById(`cm-carry-${column}`);
    if (el) {
      el.textContent = '1';
      el.classList.add('pop-in');
    }
  }

  /**
   * Shows borrow cross-out on tens/hundreds and "+10" above units in sync with crane borrowing.
   */
  showBorrowMark(fromCol, toCol, fromRemaining, toResult) {
    const fromEl = document.getElementById(`cm-orig-${fromCol}`);
    const fromRepEl = document.getElementById(`cm-borrow-${fromCol}`);
    const toCarryEl = document.getElementById(`cm-borrow-${toCol}`);

    if (fromEl) fromEl.classList.add('slashed');
    if (fromRepEl) {
      fromRepEl.textContent = String(fromRemaining);
      fromRepEl.classList.add('pop-in');
    }
    if (toCarryEl) {
      toCarryEl.textContent = String(toResult);
      toCarryEl.classList.add('pop-in');
    }
  }

  clearAnnotations() {
    this.carries = { tens: 0, hundreds: 0 };
    this.borrows = { tens: null, units: null, hundreds: null };
    this.render();
  }

  render() {
    if (!this.problem) {
      this.container.innerHTML = `
        <div class="cm-empty">
          <span>Select a problem or mode to begin</span>
        </div>
      `;
      return;
    }

    const { operation, digits1, digits2 } = this.problem;
    const opSign = operation === 'add' ? '+' : '−';

    const h1 = digits1.hundreds > 0 ? digits1.hundreds : '';
    const t1 = digits1.tens > 0 || digits1.hundreds > 0 ? digits1.tens : '';
    const u1 = digits1.units;

    const h2 = digits2.hundreds > 0 ? digits2.hundreds : '';
    const t2 = digits2.tens > 0 || digits2.hundreds > 0 ? digits2.tens : '';
    const u2 = digits2.units;

    this.container.innerHTML = `
      <div class="cm-card" aria-label="Written column arithmetic problem">
        <div class="cm-header">
          <span class="cm-col-label col-h">H</span>
          <span class="cm-col-label col-t">T</span>
          <span class="cm-col-label col-u">U</span>
        </div>

        <!-- Carry / Borrow annotation row -->
        <div class="cm-row cm-annotation-row">
          <span class="cm-cell col-h">
            <span id="cm-borrow-hundreds" class="cm-borrow-badge">${this.borrows.hundreds ?? ''}</span>
            <span id="cm-carry-hundreds" class="cm-carry-badge ${this.carries.hundreds ? 'pop-in' : ''}">${this.carries.hundreds ? '1' : ''}</span>
          </span>
          <span class="cm-cell col-t">
            <span id="cm-borrow-tens" class="cm-borrow-badge">${this.borrows.tens ?? ''}</span>
            <span id="cm-carry-tens" class="cm-carry-badge ${this.carries.tens ? 'pop-in' : ''}">${this.carries.tens ? '1' : ''}</span>
          </span>
          <span class="cm-cell col-u">
            <span id="cm-borrow-units" class="cm-borrow-badge">${this.borrows.units ?? ''}</span>
          </span>
        </div>

        <!-- Top number -->
        <div class="cm-row cm-number-row">
          <span class="cm-op-placeholder"></span>
          <span id="cm-orig-hundreds" class="cm-cell col-h">${h1}</span>
          <span id="cm-orig-tens" class="cm-cell col-t">${t1}</span>
          <span id="cm-orig-units" class="cm-cell col-u">${u1}</span>
        </div>

        <!-- Bottom number with operator -->
        <div class="cm-row cm-number-row">
          <span class="cm-op-sign">${opSign}</span>
          <span class="cm-cell col-h">${h2}</span>
          <span class="cm-cell col-t">${t2}</span>
          <span class="cm-cell col-u">${u2}</span>
        </div>

        <div class="cm-line"></div>

        <!-- Live platform result row -->
        <div class="cm-row cm-result-row">
          <span class="cm-op-placeholder">=</span>
          <span id="cm-cur-h" class="cm-cell col-h cm-live-digit">${this.currentValues.hundreds || 0}</span>
          <span id="cm-cur-t" class="cm-cell col-t cm-live-digit">${this.currentValues.tens || 0}</span>
          <span id="cm-cur-u" class="cm-cell col-u cm-live-digit">${this.currentValues.units || 0}</span>
        </div>
      </div>
    `;
  }
}
