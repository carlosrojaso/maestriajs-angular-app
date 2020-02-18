// tslint:disable: no-shadowed-variable
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppsyncService } from '../appsync.service';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import uuidv4 from 'uuid/v4';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

import { listTodos } from '../../graphql/queries';
import { createTodo as createMutation, updateTodo, deleteTodo as deleteMutation } from '../../graphql/mutations';
import { merge, fromEvent, Observable, Observer } from 'rxjs';
import { onCreateTodo } from '../../graphql/subscriptions';

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
      } else {
        this.connectionStatus = 'offline';
      }
    });
  }

  ngOnDestroy() {
    (this.listTasksSubscriber && this.listTasksSubscriber.unsubscribe())();
    (this.subsCreate && this.subsCreate.unsubscribe())();
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  async delete(task) {
    const client = await this.appsyncService.hc();

    // const taskToDelete = this.tasks.findIndex((item) => (item.id === id));
    // this.tasks.splice(taskToDelete, 1);

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

  edit(id) {
    const taskToEdit = this.getTask(id);
    const dialogRef = this.dialog.open(FormDialogComponent, { data: taskToEdit });
    dialogRef.afterClosed().subscribe(
      (result) => {
        this.tasks[taskToEdit] = result;
    });
  }

  async save() {
    const client = await this.appsyncService.hc();

    const dialogRef = this.dialog.open(FormDialogComponent);
    dialogRef.afterClosed().subscribe(
      async (response) => {
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
}
