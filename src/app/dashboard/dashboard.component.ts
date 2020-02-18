import { Component, OnInit } from '@angular/core';
import { AppsyncService } from '../appsync.service';

import { MatDialog } from '@angular/material/dialog';
import { FormDialogComponent } from '../form-dialog/form-dialog.component';

import uuidv4 from 'uuid/v4';
import gql from 'graphql-tag';

import { listTodos } from '../../graphql/queries';
import { CreateTodoInput } from '../../graphql/inputs';
import { createTodo, updateTodo, deleteTodo } from '../../graphql/mutations';
import { buildMutation } from 'aws-appsync';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  title = 'angular-app';
  tasks: any;
  listTasksSubscriber;

  constructor(
    private appsyncService: AppsyncService,
    public dialog: MatDialog
  ) {}

  async ngOnInit() {
    await this.loadTaskSubscriber();
  }

  getTask(id) {
    return this.tasks.find(item => item.id === id);
  }

  delete(id) {
    const taskToDelete = this.tasks.findIndex((item) => (item.id === id));
    this.tasks.splice(taskToDelete, 1);
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
          mutation: gql(createTodo),
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
}
