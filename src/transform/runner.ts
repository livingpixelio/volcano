import { isLeaf } from "../parsers/index.ts";
import { CacheAdapter, MdastNodeTy } from "../types.ts";
import { flattenTree } from "../parsers/markdown/metadata.ts";
import { FileMeta, MdastRootTy, Transformer } from "../types.ts";
import { FILE_TYPE } from "../constants.ts";

export const runner = (transformers: Transformer[], store: CacheAdapter) => {
  const getDataFromTitle = async (title: string) => {
    const files = await store.listValues<FileMeta>(FILE_TYPE);
    const file = files.find((item) => item.title === title);
    return file || null;
  };

  return (content: MdastRootTy): Promise<MdastRootTy> => {
    /**
     * Phase 1, figure out which nodes need to be transformed
     */
    const tasks = transformers.reduce((acc, transformer) => {
      const newTasks = flattenTree(content)
        .map((node) => {
          const result = transformer(node);
          if (!result) return false;
          return {
            key: result.key,
            promise: result.transform(getDataFromTitle),
          };
        })
        .filter(Boolean) as Task[];

      return [...acc, ...newTasks];
    }, [] as Array<Task>);

    /**
     * Phase 2: settle all promises/tasks.
     *
     * Phase 3: Walk the tree. For each node, see if there is a scheduled
     * task that matches. If there is, make sure the promise is fulfilled,
     * then
     */
    return Promise.allSettled(tasks.map((task) => task.promise)).then(
      (settled) => {
        const transformNode = (
          node: MdastNodeTy.MdastNode
        ): MdastNodeTy.MdastNode => {
          return transformers.reduce((node, transformer) => {
            const result = transformer(node);
            if (!result) return node;
            const taskIdx = tasks.findIndex((task) => task.key === result.key);
            if (taskIdx === -1) return node;
            const promiseResult = settled[taskIdx];
            if (promiseResult.status !== "fulfilled") {
              throw new Error(`TransformFailed: ${result.key}`);
            }
            return promiseResult.value;
          }, node);
        };

        const recur = (node: MdastNodeTy.MdastNode): MdastNodeTy.MdastNode => {
          if (isLeaf(node)) {
            return transformNode(node);
          }
          const transformed = transformNode(node) as MdastRootTy;
          return {
            ...transformed,
            // The hangup here appears to be that TS doesn't understand that
            // the same type of children will come back from recur.
            // Therefore, we are using any to satisfy the type
            // constraints around children
            // deno-lint-ignore no-explicit-any
            children: node.children?.map((node) => recur(node)) as any,
          };
        };
        return recur(content) as MdastRootTy;
      }
    );
  };
};

interface Task {
  key: string;
  promise: Promise<MdastNodeTy.MdastNode> | MdastNodeTy.MdastNode;
}
