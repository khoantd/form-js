import { useContext, useState } from 'preact/hooks';

import { useService } from '../../../hooks/useService';

import { FormField } from '../../FormField';

import { FormRenderContext } from '../../../context';

export function ChildrenRenderer(props) {
  const renderContext = useContext(FormRenderContext);
  const { Children } = renderContext || {};

  const { field, Empty } = props;

  // Guard against undefined field
  if (!field || !field.id) {
    return null;
  }

  // Guard against undefined context components
  if (!Children) {
    console.warn('[ChildrenRenderer] Children component is undefined from FormRenderContext');
    return null;
  }

  const { id } = field;

  const repeatRenderManager = useService('repeatRenderManager', false);

  const isRepeating = repeatRenderManager && repeatRenderManager.isFieldRepeating(id);

  // Only access Repeater and RepeatFooter if repeatRenderManager exists
  const Repeater = repeatRenderManager?.Repeater;
  const RepeatFooter = repeatRenderManager?.RepeatFooter;

  return isRepeating ? (
    <RepeatChildrenRenderer
      {...props}
      {...{ ChildrenRoot: Children, Empty, Repeater, RepeatFooter, repeatRenderManager }}
    />
  ) : (
    <SimpleChildrenRenderer {...props} {...{ ChildrenRoot: Children, Empty }} />
  );
}

function SimpleChildrenRenderer(props) {
  const { ChildrenRoot, Empty, field } = props;

  // Guard against undefined field
  if (!field) {
    return null;
  }

  // Guard against undefined context components
  if (!ChildrenRoot) {
    console.warn('[SimpleChildrenRenderer] ChildrenRoot component is undefined');
    return null;
  }

  const { components = [] } = field;

  const isEmpty = !components.length;

  return (
    <ChildrenRoot class="fjs-vertical-layout fjs-children cds--grid cds--grid--condensed" field={field}>
      <RowsRenderer {...props} />
      {isEmpty && Empty ? <Empty field={field} /> : null}
    </ChildrenRoot>
  );
}

function RepeatChildrenRenderer(props) {
  const { ChildrenRoot, repeatRenderManager, Empty, field, ...restProps } = props;

  // Guard against undefined field or repeatRenderManager
  if (!field || !repeatRenderManager) {
    return null;
  }

  // Guard against undefined context components
  if (!ChildrenRoot) {
    console.warn('[RepeatChildrenRenderer] ChildrenRoot component is undefined');
    return null;
  }

  const { components = [] } = field;

  const useSharedState = useState({ isCollapsed: true });

  const Repeater = repeatRenderManager?.Repeater;
  const RepeatFooter = repeatRenderManager?.RepeatFooter;

  return (
    <>
      <ChildrenRoot class="fjs-vertical-layout fjs-children cds--grid cds--grid--condensed" field={field}>
        {Repeater ? (
          <Repeater {...{ ...restProps, useSharedState, field, RowsRenderer }} />
        ) : (
          <RowsRenderer {...{ ...restProps, field }} />
        )}
        {!components.length && Empty ? <Empty field={field} /> : null}
      </ChildrenRoot>
      {RepeatFooter ? <RepeatFooter {...{ ...restProps, useSharedState, field }} /> : null}
    </>
  );
}

function RowsRenderer(props) {
  const { field, indexes } = props;

  // Guard against undefined field
  if (!field || !field.id) {
    return null;
  }

  const { id: parentId, verticalAlignment = 'start' } = field;

  const formLayouter = useService('formLayouter');
  const formFieldRegistry = useService('formFieldRegistry');
  const rows = formLayouter.getRows(parentId);

  const renderContext = useContext(FormRenderContext);
  const { Row } = renderContext || {};

  // Guard against undefined Row component
  if (!Row) {
    console.warn('[RowsRenderer] Row component is undefined from FormRenderContext');
    return null;
  }

  return (
    <>
      {' '}
      {rows.map((row) => {
        // Guard against undefined row
        if (!row || !row.id) {
          return null;
        }

        const { components = [] } = row;

        if (!components.length) {
          return null;
        }

        return (
          <Row key={row.id} row={row} class="fjs-layout-row cds--row" style={{ alignItems: verticalAlignment }}>
            {components.map((childId) => {
              // Guard against undefined/null childId
              if (!childId) {
                return null;
              }

              const childField = formFieldRegistry.get(childId);

              if (!childField) {
                return null;
              }

              return <FormField {...props} key={childId} field={childField} indexes={indexes} />;
            })}
          </Row>
        );
      })}{' '}
    </>
  );
}
