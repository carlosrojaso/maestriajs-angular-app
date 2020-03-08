// tslint:disable: no-shadowed-variable
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppsyncService } from '../appsync.service';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import uuidv4 from 'uuid/v4';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

import { listTodos } from '../../graphql/queries';
import { createTodo as createMutation, updateTodo as updateMutation, deleteTodo as deleteMutation } from '../../graphql/mutations';
import { merge, fromEvent, Observable, Observer } from 'rxjs';
import { onCreateTodo, onDeleteTodo, onUpdateTodo } from '../../graphql/subscriptions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  tasks: any;
  listTasksSubscriber;
  connectionStatus = 'offline';
  subsCreate: any;
  subsDelete: any;
  subsUpdate: any;
  title = 'angular-app';

  constructor(
    private appsyncService: AppsyncService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadTaskSubscriber();

    this.detectOnline().subscribe( async isOnline => {
      if (isOnline) {
        this.connectionStatus = 'online';
        await this.loadOnCreateSubscriber();
        await this.loadOnDeleteSubscriber();
        await this.loadOnUpdateSubscriber();
      } else {
        this.connectionStatus = 'offline';
      }
    });
  }

  ngOnDestroy() {
    (this.listTasksSubscriber && this.listTasksSubscriber.unsubscribe())();
    (this.subsCreate && this.subsCreate.unsubscribe())();
    (this.subsDelete && this.subsDelete.unsubscribe())();
    (this.subsUpdate && this.subsUpdate.unsubscribe())();
  }

  async delete(task) {
    const client = await this.appsyncService.hc();

    const result = await client.mutate({
      mutation: gql(deleteMutation),
      variables: {
        input: {
          id: task.id
        }
      },
      optimisticResponse: () => ({
        deleteTodo: {
          __typename: '', // This type must match the return type of the query below (listTodos)
          id: task.id,
          name: task.name,
          description: task.description
        }
      }),
      update: (cache, { data: { deleteTodo } }) => {
        const query = gql(listTodos);

        // Read query from cache
        const data = cache.readQuery({ query });

        // Remove item to the cache copy
        data.listTodos.items = [...data.listTodos.items.filter(item => item.id !== deleteTodo.id)];

        // Overwrite the cache with the new results
        cache.writeQuery({ query, data });
      }
    });
  }

  detectOnline() {
    return merge<boolean>(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      }));
  }

  async edit(task) {
    const client = await this.appsyncService.hc();

    const dialogRef = this.dialog.open(FormDialogComponent, { data: task });
    dialogRef.afterClosed().subscribe(
      async (response) => {
        if (response) {
          const result =  await client.mutate({
            mutation: gql(updateMutation),
            variables: {
              input: {
                id: task.id,
                name: task.name,
                description: task.description,
              }
            },
            optimisticResponse: () => ({
              updateTodo: {
                __typename: '', // This type must match the return type of the query below (listTodos)
                id: task.id,
                name: task.name,
                description: task.description
              }
            }),
            update: (cache, { data: { updateTodo } }) => {
              const query = gql(listTodos);

              // Read query from cache
              const data = cache.readQuery({ query });

              const objIndex = data.listTodos.items.findIndex((obj => obj.id === updateTodo.id));

              data.listTodos.items[objIndex].name = updateTodo.name;
              data.listTodos.items[objIndex].description = updateTodo.description;

              // Overwrite the cache with the new results
              cache.writeQuery({ query, data });
            }
          });

          if (result) {
            console.log(result);
          }
        }
    });
  }

  handleDelete(id) {
    const objIndex = this.tasks.findIndex((obj => obj.id === id));
    if (objIndex >= 0) {
      this.tasks.splice(objIndex, 1);
    }
  }

  handleEdit(task) {
    const objIndex = this.tasks.findIndex((obj => obj.id === task.id));
    this.tasks[objIndex] = {...task};
  }

  async save() {
    const client = await this.appsyncService.hc();

    const dialogRef = this.dialog.open(FormDialogComponent);
    dialogRef.afterClosed().subscribe(
      async (response) => {
        if (response) {
          const newIndex = uuidv4();
          response.id = newIndex;

          const result = await client.mutate({
            mutation: gql(createMutation),
            variables: {
              input: response
            },
            optimisticResponse: () => ({
              createTodo: {
                __typename: '',
                id: response.id,
                name: response.name,
                description: response.description,
              }
            }),
            update: (cache, { data: { createTodo } }) => {
              const query = gql(listTodos);

              // Read query from cache
              const data = cache.readQuery({ query });

              // Add newly created item to the cache copy
              data.listTodos.items = [
                ...data.listTodos.items.filter(item => item.id !== createTodo.id),
                createTodo
              ];

              // Overwrite the cache with the new results
              cache.writeQuery({ query, data });
            }
          });

          if (result) {
            console.log(result);
          }
        }
    });
  }

  async loadOnCreateSubscriber() {
    this.subsCreate = await this.onCreateListener();

    this.subsCreate.subscribe({
      next: data => {
        if (data.data.onCreateTodo) {
            this.tasks = this.tasks.filter((el) => (el.id !== undefined));
            const objIndex = this.tasks.findIndex((obj => obj.id === data.data.onCreateTodo.id));
            if (objIndex < 0) {
              this.tasks.push(data.data.onCreateTodo);
            }
        }
      },
      error: error => {
        console.warn(error);
      }
    });
  }

  async loadOnDeleteSubscriber() {
    this.subsDelete = await this.onDeleteListener();

    this.subsDelete.subscribe({
      next: data => {
        if (data.data.onDeleteTodo) {
          this.handleDelete(data.data.onDeleteTodo.id);
        }
      },
      error: error => {
        console.warn(error);
      }
    });
  }

  async loadOnUpdateSubscriber() {
    this.subsUpdate = await this.onUpdateListener();

    this.subsUpdate.subscribe({
      next: data => {
        if (data.data.onUpdateTodo) {
          this.handleEdit(data.data.onUpdateTodo);
        }
      },
      error: error => {
        console.warn(error);
      }
    });
  }

  async loadTasks() {
    const client = await this.appsyncService.hc();

    const options = {
      query: gql(listTodos),
      fetchPolicy: 'cache-and-network'
    };

    return client.watchQuery(options);
  }

  async loadTaskSubscriber() {
    this.listTasksSubscriber = await this.loadTasks();
    this.listTasksSubscriber.subscribe(
      ({data}) => {
        if (data && data.hasOwnProperty('listTodos')) {
          this.tasks = data.listTodos.items;
        }
      },
      (err: any) => {
        console.warn(err);
      }
    );
  }

  async onCreateListener() {
    const client = await this.appsyncService.hc();
    return client.subscribe({query: gql(onCreateTodo)});
  }

  async onDeleteListener() {
    const client = await this.appsyncService.hc();
    return client.subscribe({query: gql(onDeleteTodo)});
  }

  async onUpdateListener() {
    const client = await this.appsyncService.hc();
    return client.subscribe({query: gql(onUpdateTodo)});
  }
}
