import { keymap } from 'prosemirror-keymap';
import { Plugin, Selection } from 'prosemirror-state';
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  CellSelection,
} from 'prosemirror-tables';
import { emptyCell, findCellClosestToPos, isCellSelection } from 'prosemirror-utils';
import { analyticsService } from '../../../analytics';
import * as keymaps from '../../../keymaps';
import {
  ACTION,
  ACTION_SUBJECT,
  ACTION_SUBJECT_ID,
  EVENT_TYPE,
  INPUT_METHOD,
  withAnalytics,
} from '../../analytics';
import { createTable, goToNextCell, moveCursorBackward, triggerUnlessTableHeader } from '../../actions';

const createTableWithAnalytics = () =>
  withAnalytics({
    action: ACTION.INSERTED,
    actionSubject: ACTION_SUBJECT.DOCUMENT,
    actionSubjectId: ACTION_SUBJECT_ID.TABLE,
    attributes: { inputMethod: INPUT_METHOD.SHORTCUT },
    eventType: EVENT_TYPE.TRACK,
  })(createTable);

export function keymapPlugin(): Plugin {
  const list = {};

  keymaps.bindKeymapWithCommand(keymaps.nextCell.common!, goToNextCell(1), list);
  keymaps.bindKeymapWithCommand(keymaps.previousCell.common!, goToNextCell(-1), list);
  keymaps.bindKeymapWithCommand(keymaps.toggleTable.common!, createTableWithAnalytics(), list);
  keymaps.bindKeymapWithCommand(
    keymaps.backspace.common!,
    (state, dispatch) => {
      if (!isCellSelection(state.selection)) {
        return false;
      }
      let { tr } = state;
      const selection = (tr.selection as any) as CellSelection;
      selection.forEachCell((node, pos) => {
        const $pos = tr.doc.resolve(tr.mapping.map(pos + 1));
        tr = emptyCell(findCellClosestToPos($pos)!, state.schema)(tr);
      });
      if (tr.docChanged) {
        const $pos = tr.doc.resolve(tr.mapping.map(selection.$headCell.pos));
        const textSelection = Selection.findFrom($pos, 1, true);
        if (textSelection) {
          tr.setSelection(textSelection);
        }

        if (dispatch) {
          dispatch(tr);
        }

        analyticsService.trackEvent('atlassian.editor.format.table.delete_content.keyboard');
        return true;
      }
      return false;
    },
    list,
  );
  keymaps.bindKeymapWithCommand(keymaps.backspace.common!, moveCursorBackward, list);

  // Add row/column shortcuts
  keymaps.bindKeymapWithCommand(keymaps.addRowBefore.common!, triggerUnlessTableHeader(addRowBefore), list);

  keymaps.bindKeymapWithCommand(keymaps.addRowAfter.common!, addRowAfter, list);

  keymaps.bindKeymapWithCommand(
    keymaps.addColumnBefore.common!,
    triggerUnlessTableHeader(addColumnBefore),
    list,
  );

  keymaps.bindKeymapWithCommand(keymaps.addColumnAfter.common!, addColumnAfter, list);

  return keymap(list);
}

export default keymapPlugin;
